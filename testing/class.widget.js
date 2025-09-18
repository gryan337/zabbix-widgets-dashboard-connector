                                infoDiv.addEventListener('click', (event) => {
                                        if (!event.target.closest('button')) {
                                                event.stopPropagation();
                                                infoDiv.classList.add('waiting');
                                                setTimeout(() => infoDiv.classList.remove('waiting'), 500);
                                                this.showTooltip(infoDiv, 'Please wait until the previous request has completed');
                                                this.hideGroupNodes();
                                                this.#selected_groupid = groupID;
                                                this.markSelected(infoDiv);
                                                this.refreshTree();
                                                this.scrollToSelection();
                                        }
                                });




        showTooltip(target, message) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip-warning';

                tooltip.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                viewBox="0 0 24 24" aria-hidden="true">
                                <polygon points="12,2 22,12 12,22 2,12"
                                fill="#FFD700" stroke="black" stroke-width="2"/>
                                <text x="12" y="16" text-anchor="middle" font-size="14"
                                font-weight="bold" fill="black">!</text>
                        </svg>
                        <span>${message}</span>
                `;

                document.body.appendChild(tooltip);

                const rect = target.getBoundingClientRect();
                tooltip.style.top = rect.top + window.scrollY - tooltip.offsetHeight - 8 + "px";
                tooltip.style.left = rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2 + "px";

                requestAnimationFrame(() => tooltip.classList.add("show"));

                setTimeout(() => {
                        tooltip.classList.remove("show");
                        tooltip.addEventListener("transitionend", () => tooltip.remove(), { once: true });
                }, 1500);
        }



                                .waiting {
                                        cursor: wait !important;
                                        animation: shake 0.3s;
                                }
                                @keyframes shake {
                                        0% { transform: translateX(0px); }
                                        25% { transform: translateX(-3px); }
                                        50% { transform: translateX(3px); }
                                        75% { transform: translateX(-3px); }
                                        100% { transform: translateX(0px); }
                                }
                                .tooltip-warning {
                                        position: absolute;
                                        background: #6a0dad;
                                        color: #fff;
                                        padding: 6px 10px;
                                        border-radius: 6px;
                                        font-size: 13px;
                                        font-weight: 500;
                                        display: flex;
                                        align-items: center;
                                        gap: 6px;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                                        z-index: 9999;
                                        pointer-events: none;
                                        opacity: 0;
                                        transform: translateY(-6px);
                                        transition: opacity 0.2s ease, transform 0.2s ease;
                                }
                                .tooltip-warning.show {
                                        opacity: 1;
                                        transform: translateY(0);
                                }
