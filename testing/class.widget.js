#!/usr/bin/env python3
"""
Zabbix MySQL Partition Maintenance Script
-----------------------------------------
Maintains daily partitions for history tables (15 days retention)
and monthly partitions for trends tables (12 months retention).

Features:
 - MySQL 8.4+ compatible (tested with PyMySQL)
 - Robust error handling and validation
 - Dry-run mode (--dry-run)
 - Configurable retention and future partitions
 - Cronjob safe and idempotent
 - Detailed logging (stdout + file)

Author: RME
"""

import pymysql
import logging
import sys
import datetime
import traceback
import argparse
from contextlib import contextmanager

# ==========================
# CONFIGURATION
# ==========================
DB_CONFIG = {
    "host": "localhost",
    "user": "zabbix",
    "password": "secret",
    "database": "zabbix",
    "charset": "utf8mb4",
    "autocommit": True,
    "connect_timeout": 10
}

# Retention policy
HISTORY_RETENTION_DAYS = 15
TRENDS_RETENTION_MONTHS = 12

# Future partition creation windows
HISTORY_FUTURE_DAYS = 3
TRENDS_FUTURE_MONTHS = 2

# Tables
HISTORY_TABLES = [
    "history", "history_uint", "history_log",
    "history_str", "history_text", "history_bin"
]
TRENDS_TABLES = ["trends", "trends_uint"]

LOG_FILE = "/var/log/zabbix_partition_maint.log"


# ==========================
# LOGGING
# ==========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)


# ==========================
# MYSQL UTILITIES
# ==========================
@contextmanager
def get_connection():
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        yield conn
    except Exception as e:
        logging.error(f"MySQL connection failed: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()


def exec_query(conn, sql, args=None, fetch=False, dry_run=False):
    """Execute SQL safely with optional dry-run."""
    try:
        if dry_run:
            logging.info(f"[DRY-RUN] Would execute: {sql}")
            return None

        with conn.cursor() as cur:
            cur.execute(sql, args)
            if fetch:
                return cur.fetchall()
    except Exception as e:
        logging.error(f"SQL failed: {sql} | {e}")
        raise


def table_exists(conn, table):
    sql = """
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s
    """
    rows = exec_query(conn, sql, (DB_CONFIG["database"], table), fetch=True)
    return rows[0][0] > 0 if rows else False


def get_existing_partitions(conn, table):
    sql = """
        SELECT PARTITION_NAME, PARTITION_DESCRIPTION
        FROM INFORMATION_SCHEMA.PARTITIONS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s
        ORDER BY PARTITION_DESCRIPTION
    """
    rows = exec_query(conn, sql, (DB_CONFIG["database"], table), fetch=True)
    return {r[0]: int(r[1]) for r in rows if r[0]}


# ==========================
# PARTITION OPS
# ==========================
def make_partition_name(prefix, date):
    return f"p{prefix}{date.strftime('%Y%m%d')}"


def add_partition(conn, table, name, value, dry_run=False):
    sql = f"ALTER TABLE `{table}` ADD PARTITION (PARTITION `{name}` VALUES LESS THAN ({value}));"
    logging.info(f"Adding partition {name} (< {value}) for {table}")
    exec_query(conn, sql, dry_run=dry_run)


def drop_partition(conn, table, name, dry_run=False):
    sql = f"ALTER TABLE `{table}` DROP PARTITION `{name}`;"
    logging.info(f"Dropping old partition {name} for {table}")
    exec_query(conn, sql, dry_run=dry_run)


# ==========================
# VALIDATION HELPERS
# ==========================
def validate_partition_order(partitions):
    """Ensure partition values are strictly increasing."""
    values = list(partitions.values())
    return all(earlier < later for earlier, later in zip(values, values[1:]))


# ==========================
# HISTORY TABLE MGMT
# ==========================
def manage_history_table(conn, table, dry_run=False):
    now = datetime.date.today()
    start_keep = now - datetime.timedelta(days=HISTORY_RETENTION_DAYS)
    end_create = now + datetime.timedelta(days=HISTORY_FUTURE_DAYS)

    partitions = get_existing_partitions(conn, table)
    if not validate_partition_order(partitions):
        logging.warning(f"Partition order issue detected for {table}!")

    # Create missing daily partitions
    for i in range((end_create - start_keep).days + 1):
        day = start_keep + datetime.timedelta(days=i + 1)
        ts = int(datetime.datetime.combine(day, datetime.time()).timestamp())
        pname = make_partition_name("d", day)
        if pname not in partitions:
            try:
                add_partition(conn, table, pname, ts, dry_run)
            except Exception:
                logging.error(f"Failed to add partition {pname} for {table}")
                traceback.print_exc()

    # Drop expired partitions
    for pname, ts in list(partitions.items()):
        part_date = datetime.date.fromtimestamp(ts)
        if part_date < start_keep:
            try:
                drop_partition(conn, table, pname, dry_run)
            except Exception:
                logging.error(f"Failed to drop partition {pname} for {table}")
                traceback.print_exc()


# ==========================
# TRENDS TABLE MGMT
# ==========================
def manage_trends_table(conn, table, dry_run=False):
    now = datetime.date.today().replace(day=1)
    start_keep = now - datetime.timedelta(days=30 * TRENDS_RETENTION_MONTHS)
    end_create = now + datetime.timedelta(days=30 * TRENDS_FUTURE_MONTHS)

    partitions = get_existing_partitions(conn, table)
    if not validate_partition_order(partitions):
        logging.warning(f"Partition order issue detected for {table}!")

    cur = start_keep
    while cur <= end_create:
        next_month = (cur.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        pname = f"p{cur.strftime('%Y%m')}"
        ts = int(datetime.datetime.combine(next_month, datetime.time()).timestamp())

        if pname not in partitions:
            try:
                add_partition(conn, table, pname, ts, dry_run)
            except Exception:
                logging.error(f"Failed to add partition {pname} for {table}")
                traceback.print_exc()

        cur = next_month

    # Drop expired partitions
    for pname, ts in list(partitions.items()):
        part_date = datetime.date.fromtimestamp(ts)
        if part_date < start_keep:
            try:
                drop_partition(conn, table, pname, dry_run)
            except Exception:
                logging.error(f"Failed to drop partition {pname} for {table}")
                traceback.print_exc()


# ==========================
# MAIN EXECUTION
# ==========================
def main():
    parser = argparse.ArgumentParser(description="Zabbix MySQL Partition Maintenance")
    parser.add_argument("--dry-run", action="store_true", help="Simulate actions without executing SQL")
    args = parser.parse_args()
    dry_run = args.dry_run

    with get_connection() as conn:
        try:
            # Validate tables exist
            all_tables = HISTORY_TABLES + TRENDS_TABLES
            for tbl in all_tables:
                if not table_exists(conn, tbl):
                    logging.warning(f"Table {tbl} not found in database; skipping.")
            
            # Manage partitions
            for table in HISTORY_TABLES:
                if table_exists(conn, table):
                    logging.info(f"--- Managing history table: {table} ---")
                    manage_history_table(conn, table, dry_run)

            for table in TRENDS_TABLES:
                if table_exists(conn, table):
                    logging.info(f"--- Managing trends table: {table} ---")
                    manage_trends_table(conn, table, dry_run)

            logging.info("Partition maintenance completed successfully.")
        except Exception as e:
            logging.error(f"Fatal error during partition maintenance: {e}")
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    main()
