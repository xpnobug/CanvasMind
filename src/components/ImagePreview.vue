<template>
<div class="container-6nn" v-if="visible">
    <div class="preview-area-sif">
        <div class="container-v1p style-FGbyJ" id="style-FGbyJ">
            <div class="preview-area-gai style-hDdWL" id="style-hDdWL">
                <div class="menu-l6r">
                    <div class="container-lik">
                        <div class="image-4f4">
                            <div class="container-zgw">
                                <div class="content-doz">
                                    <div class="container-7y7 image-pkd"><img v-if="currentImage" class="image-3td" :src="currentImage.src" :alt="currentImage.id"></div>
                                </div>
                            </div>
                            <div class="container-yfw image-esx">
                                <div class="container-dy5" @click="prevImage" :class="{ 'disabled': internalIndex === 0 }"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="arrow-PkBH8b">
                                        <g>
                                            <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M6.26 12.844a1.2 1.2 0 0 1 0-1.688L14.321 3a1.2 1.2 0 0 1 1.707 1.687L8.801 12l7.227 7.313A1.2 1.2 0 0 1 14.321 21l-8.06-8.156Z" fill="currentColor" />
                                        </g>
                                    </svg></div><span class="page-number-ngg"><span class="num-hli">{{ internalIndex + 1 }}</span><span>/</span><span class="num-hli">{{ totalImages }}</span></span>
                                <div class="container-dy5" @click="nextImage" :class="{ 'disabled': internalIndex === totalImages - 1 }"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="arrow-PkBH8b">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M17.74 12.844a1.2 1.2 0 0 0 0-1.688L9.678 3A1.2 1.2 0 1 0 7.97 4.687L15.2 12l-7.23 7.313A1.2 1.2 0 1 0 9.68 21l8.06-8.156Z" fill="currentColor" />
                                        </g>
                                    </svg></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showEditArea" class="dimension-layout-gin fa-zl6 content-g4w content-no8 style-4b99h" id="style-4b99h">
                <div class="layout-exd">
                    <div class="content-by2">
                        <div class="references-n5d">
                            <div class="reference-group-62r style-roYWx" id="style-roYWx">
                                <div class="reference-group-background-6tp"></div>
                                <div class="reference-group-hover-trigger-w3c"></div>
                                <div class="content-n2n expanded-cib">
                                    <div class="item-434 expanded-r74 style-Y9vHg" id="style-Y9vHg">
                                        <div class="reference-upload-l7z style-fygp8" id="style-fygp8"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-TrJRuq">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M10.8 20a1.2 1.2 0 0 0 2.4 0v-6.8H20a1.2 1.2 0 1 0 0-2.4h-6.8V4a1.2 1.2 0 0 0-2.4 0v6.8H4a1.2 1.2 0 0 0 0 2.4h6.8V20Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                            </svg><input type="file" class="input-ogf"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="content-395">
                            <div class="container-9da style-Y5XqH" id="style-Y5XqH">
                                <div class="text-2e1">一只猫在花园里玩耍，卡通风格</div><textarea class="text-dlj text-kxo text-hkz" placeholder="请描述你想生成的图片">一只猫在花园里玩耍，卡通风格</textarea><input placeholder="请描述你想生成的图片" class="input-iyx input-9x2 input-sda" value="一只猫在花园里玩耍，卡通风格">
                            </div>
                        </div>
                        <div class="container-wsp">
                            <div class="content-rva"><svg width="1em" height="1em" viewBox="0 0 25 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                    <g>
                                        <path data-follow-fill="currentColor" d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924a.358.358 0 0 0-.006-.033.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.673.673 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797v-.033Z" fill="currentColor" />
                                    </g>
                                </svg>1 / 张</div>
                            <div><button class="btn-kl4 btn-primary-47x btn-o3f btn-szl icon-f7s button-gx6 button-wme button-x4x expand-transition-start-qe3" type="button"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor" />
                                        </g>
                                    </svg></button></div>
                        </div>
                    </div>
                    <div class="bar-sax">
                        <div class="container-aiz bar-o67">
                            <div class="content-ykn content-mdl">
                                <div class="select-ixl select-h6t select-nxv select-c9c select-h4o select-vel">
                                    <div class="select-5oc"><span class="select-8x2"><input class="select-bic select-l45 style-ybqQV" value id="style-ybqQV"><span class="select-2cn"><span class="select-dvl"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                        <g>
                                                            <path data-follow-fill="currentColor" d="M16.393 2.607a5 5 0 0 1 5 5v4.265A6 6 0 0 0 19.6 11.6c-.07 0-.139.002-.207.004V7.607a3 3 0 0 0-3-3H7.607a3 3 0 0 0-3 3v7.728l3.559-3.69a3.161 3.161 0 0 1 4.357-.184l2.536 2.219a5.992 5.992 0 0 0-1.05 1.74l-2.804-2.454a1.161 1.161 0 0 0-1.6.067l-4.628 4.8a2.998 2.998 0 0 0 2.63 1.56h6.265c.23.738.601 1.414 1.08 2H7.606l-.256-.007a5 5 0 0 1-4.634-3.956l-.068-.064.044-.047a5.01 5.01 0 0 1-.079-.67l-.007-.257V7.607a5 5 0 0 1 5-5h8.786Zm-.704 4.23a1.556 1.556 0 1 1 0 3.112 1.556 1.556 0 0 1 0-3.112Z" fill="currentColor" />
                                                            <path data-follow-fill="currentColor" d="M18.96 14.577a.727.727 0 0 1 1.34 0 4.577 4.577 0 0 0 2.395 2.413.737.737 0 0 1 0 1.352 4.577 4.577 0 0 0-2.395 2.413.727.727 0 0 1-1.34 0 4.578 4.578 0 0 0-2.395-2.413.738.738 0 0 1 0-1.352 4.577 4.577 0 0 0 2.394-2.413Z" fill="currentColor" />
                                                        </g>
                                                    </svg></span>图片生成</span></span>
                                        <div class="select-9pz">
                                            <div class="select-rpw"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                    <g>
                                                        <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor" />
                                                    </g>
                                                </svg></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="select-ixl select-h6t select-nxv select-c9c select-vel">
                                    <div class="select-5oc"><span class="select-8x2"><input class="select-bic select-l45 style-EzWOW" value id="style-EzWOW"><span class="select-2cn"><svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                    <g>
                                                        <path data-follow-fill="currentColor" d="M13.25 2.682a2.5 2.5 0 0 0-2.5 0L4.556 6.258a2.5 2.5 0 0 0-1.25 2.165v7.153a2.5 2.5 0 0 0 1.25 2.165l6.194 3.576a2.5 2.5 0 0 0 2.5 0l6.194-3.576a2.5 2.5 0 0 0 1.25-2.165V8.423a2.5 2.5 0 0 0-1.25-2.165L13.25 2.682Zm-1.6 1.559a.7.7 0 0 1 .7 0L17.995 7.5 12 10.96 6.005 7.5l5.645-3.26Zm1.25 8.279v6.92l5.644-3.258a.7.7 0 0 0 .35-.606V9.059l-5.994 3.46ZM5.106 9.059l5.994 3.46v6.922l-5.644-3.259a.7.7 0 0 1-.35-.606V9.059Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                </svg>图片 4.0</span></span>
                                        <div class="select-9pz"></div>
                                    </div>
                                </div><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-gx6 button-663" type="button"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M19.25 17.25V6.75a2 2 0 0 0-2-2H6.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2Zm2-10.5a4 4 0 0 0-4-4H6.75a4 4 0 0 0-4 4v10.5a4 4 0 0 0 4 4h10.5a4 4 0 0 0 4-4V6.75Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                        </g>
                                    </svg><span class="button-86l">1:1<div class="divider-xk6"></div>
                                        <div class="content-162">高清 2K</div>
                                    </span></button>
                                <div><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv icon-f7s button-gx6 button-663" type="button"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                            <g>
                                                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M11.26 6.362H5.604v1.595a.871.871 0 1 1-1.743 0V5.491c0-.482.39-.872.871-.872h14.801c.482 0 .872.39.872.872v2.466a.871.871 0 0 1-1.743 0V6.362h-5.658v13.113c0 .481-.39.872-.871.872h-2.63a.871.871 0 0 1 0-1.743h1.757V6.362Zm5.058 11.202c-.776-.05-1.39-.708-1.39-1.513 0-.836.664-1.515 1.483-1.515.655 0 1.211.434 1.408 1.035.151.42.234.873.234 1.345a3.911 3.911 0 0 1-1.844 3.337c-.504.31-1.069-.123-1.069-.715 0-.351.214-.66.481-.888.324-.277.572-.652.697-1.086Zm2.557-1.512c0 .804.614 1.462 1.39 1.512a2.245 2.245 0 0 1-.697 1.086c-.267.229-.48.537-.48.889 0 .591.565 1.025 1.068.714A3.911 3.911 0 0 0 22 16.916c0-.47-.081-.92-.23-1.337a1.488 1.488 0 0 0-1.411-1.043c-.82 0-1.484.679-1.484 1.516Z" fill="currentColor" />
                                            </g>
                                        </svg></button></div>
                            </div>
                        </div>
                        <div class="bar-siq">
                            <div class="content-rva"><svg width="1em" height="1em" viewBox="0 0 25 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                    <g>
                                        <path data-follow-fill="currentColor" d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924a.358.358 0 0 0-.006-.033.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.673.673 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797v-.033Z" fill="currentColor" />
                                    </g>
                                </svg>1 / 张</div>
                            <div><button class="btn-kl4 btn-primary-47x btn-o3f btn-szl icon-f7s button-gx6 button-wme button-rxz expand-transition-start-qe3" type="button"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor" />
                                        </g>
                                    </svg></button></div>
                        </div>
                    </div>
                </div>
            </div>
            <div data-task-indicator-container="true" class="container-764 style-x1EcJ" id="style-x1EcJ">
                <div data-task-indicator="true" class="task-indicator-a8h task-indicator-9my content-xjg no-task-g2q hidden-51z">
                    <div class="status-yto content-mcc no-task-plj"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-M8qF2b">
                            <g>
                                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.48 6.48 2 12 2c5.53 0 10 4.48 10 10s-4.47 10-10 10C6.48 22 2 17.52 2 12Zm9.12-3.79c0-.48.4-.88.88-.88s.87.4.87.88v4.42a.87.87 0 0 1-.87.87.879.879 0 0 1-.88-.87V8.21Zm.89 8.47c-.49 0-.88-.4-.88-.88s.39-.87.87-.87c.49 0 .88.39.88.87s-.39.88-.87.88Z" fill="currentColor" />
                            </g>
                        </svg>
                        <div class="container-k8l container-qof">
                            <div class="brand-gradient-46o"></div>
                            <div class="spin-h3v spin-tcs"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="loading-icon-OLVJQG">
                                    <g>
                                        <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M9.836 2.883A9.37 9.37 0 0 1 21.32 12.962a1 1 0 1 1-1.99-.205 7.37 7.37 0 1 0-5.37 6.347 1 1 0 1 1 .533 1.928A9.37 9.37 0 1 1 9.836 2.883Z" fill="currentColor" />
                                    </g>
                                </svg></div>
                            <div class="border-9k7"></div>
                        </div>
                    </div><button class="btn-kl4 btn-secondary-3gh btn-jhp btn-elv button-8vo" type="button"><span>去查看</span><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path data-follow-fill="currentColor" d="M17.74 12.844a1.2 1.2 0 0 0 0-1.688L9.678 3A1.2 1.2 0 1 0 7.97 4.687L15.2 12l-7.23 7.313A1.2 1.2 0 1 0 9.68 21l8.06-8.156Z" fill="currentColor" />
                            </g>
                        </svg></button>
                    <div class="card-eei">
                        <div class="card-fqt">
                            <div class="card-j9m">
                                <div class="content-woc"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M18.104 14.462c-1.359 2.008-2.203 4.3-1.87 6.566a.723.723 0 0 1-.397.76.747.747 0 0 1-.852-.162c-1.603-1.683-3.903-2.463-6.301-2.643a26.536 26.536 0 0 0 5.107-1.877 26.004 26.004 0 0 0 4.316-2.647l-.003.003ZM6.339 2.258a.575.575 0 0 1 .732.202c3.953 5.991 8.172 7.646 13.622 6.642a.931.931 0 0 1 .997.496c.415.832-.438 1.344-.964 1.832-1.485 1.198-4.25 2.932-7.573 4.553-3.326 1.621-6.397 2.734-8.251 3.166-.402.063-.808.188-1.216.202-.81-.054-1.2-1.119-.583-1.669C7.235 14.016 8.323 9.77 6.047 2.96a.574.574 0 0 1 .292-.701Z" fill="currentColor" />
                                        </g>
                                    </svg></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="operation-area-t8g">
        <div class="switch-4ty"><button class="button-e79"><svg width="20" height="20" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M21.01 16.018a1.2 1.2 0 0 0-.01-1.697l-8.156-8.06a1.2 1.2 0 0 0-1.688 0L3 14.32a1.2 1.2 0 0 0 1.687 1.707L12 8.801l7.313 7.227a1.2 1.2 0 0 0 1.697-.01Z" fill="currentColor" />
                    </g>
                </svg></button><button class="button-e79"><svg width="20" height="20" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor" />
                    </g>
                </svg></button></div><button class="button-e79 button-ldy" @click="closePreview"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path data-follow-fill="currentColor" d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                </g>
            </svg></button><button class="button-e79 button-gfl"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M7 12a1 1 0 0 1 1-1h10.312L14.29 6.977a1 1 0 0 1 1.414-1.414l5.728 5.73a1 1 0 0 1 0 1.414l-5.728 5.73a1 1 0 1 1-1.414-1.414L18.31 13H8a1 1 0 0 1-1-1Zm-2.998 9a1 1 0 0 1-1-1L3 4a1 1 0 1 1 2 0l.002 16a1 1 0 0 1-1 1Z" fill="currentColor" />
                </g>
            </svg></button>
    </div>
    <div class="detail-area-3l3">
        <div class="container-yna">
            <div class="operation-area-r18">
                <div class="button-zqa"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-7zg" type="button" @click="handleDownload">
                        <div class="wrapper-3fx"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                    <path data-follow-fill="currentColor" d="M12 2a1 1 0 0 1 1 1v10.312l4.023-4.021a1 1 0 0 1 1.414 1.414l-5.73 5.728a1 1 0 0 1-1.414 0l-5.73-5.728A1 1 0 1 1 6.977 9.29L11 13.312V3a1 1 0 0 1 1-1ZM3 20.002a1 1 0 0 1 1-1L20 19a1 1 0 0 1 0 2l-16 .002a1 1 0 0 1-1-1Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                </g>
                            </svg></div><span>下载</span>
                    </button></div>
                <div class="button-xxy">
                    <div class="button-dbr" @click="handleFavorite">
                        <div class="wrapper-5ak"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                    <path data-follow-fill="currentColor" d="M9.893 7.177 12 3.787l2.107 3.39a3 3 0 0 0 1.829 1.329l3.874.956-2.572 3.052a3 3 0 0 0-.698 2.15l.287 3.98-3.697-1.503a3 3 0 0 0-2.26 0l-3.697 1.503.287-3.98a3 3 0 0 0-.698-2.15L4.19 9.462l3.874-.956a3 3 0 0 0 1.829-1.329Zm1.258-5.811a1 1 0 0 1 1.698 0l2.957 4.755a1 1 0 0 0 .61.443l5.435 1.342a1 1 0 0 1 .525 1.616l-3.609 4.28a1 1 0 0 0-.232.717l.403 5.585a1 1 0 0 1-1.374.998l-5.187-2.109a1 1 0 0 0-.754 0l-5.187 2.11a1 1 0 0 1-1.374-.999l.404-5.585a1 1 0 0 0-.233-.716l-3.61-4.281a1 1 0 0 1 .526-1.616l5.436-1.342a1 1 0 0 0 .61-.443l2.956-4.755Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                </g>
                            </svg></div>
                    </div>
                    <div class="button-dbr" @click="handlePublish">
                        <div class="wrapper-5ak"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                    <path data-follow-fill="currentColor" d="M17.523 8.332a1 1 0 0 1-1.415 0L13 5.223v9.357a1 1 0 1 1-2 0V5.223L7.892 8.332a1 1 0 1 1-1.415-1.415l4.816-4.815a1 1 0 0 1 1.414 0l4.816 4.816a1 1 0 0 1 0 1.414ZM4.439 14.58a1 1 0 1 0-2 0v2.35a4 4 0 0 0 4 4h11.122a4 4 0 0 0 4-4v-2.35a1 1 0 0 0-2 0v2.35a2 2 0 0 1-2 2H6.439a2 2 0 0 1-2-2v-2.35Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                </g>
                            </svg></div>
                    </div>
                    <div class>
                        <div class="button-dbr">
                            <div class="wrapper-5ak"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                    <g>
                                        <path data-follow-fill="currentColor" d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                    </g>
                                </svg></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="section-49x">
                <div class="container-lv5 thumbnail-z4m">
                    <div class="container-9ol">
                        <div 
                            v-for="(image, index) in images" 
                            :key="image.id"
                            class="thumbnail-o8j" 
                            :class="{ 'select-6op': index === internalIndex }"
                            @click="internalIndex = index"
                        >
                            <img :src="image.src" :alt="image.id">
                        </div>
                    </div>
                </div>
                <div class="info-di6">
                    <div class="prompt-tip-91m">图片提示词</div>
                    <div class="prompt-value-7wp">
                        <div class="text-zrl"><span class="container-qgq"><span>一只猫在花园里玩耍，卡通风格</span></span></div>
                    </div>
                    <div class="tag-4dn">
                        <div>图片 4.0</div> <span class="divider-kwh"></span>
                        <div>1:1</div> <span class="divider-kwh"></span>
                        <div>2K</div> <span class="divider-kwh"></span><span class="label-95f"><span class="label-zap"><span class="label-315"><span class="label-dn6">详细信息</span><svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-wfMHhd">
                                        <g>
                                            <path data-follow-fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-10.3a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm0 7.2a1.2 1.2 0 0 0 1.2-1.2v-3.6a1.2 1.2 0 0 0-2.4 0v3.6a1.2 1.2 0 0 0 1.2 1.2Z" fill="currentColor" />
                                        </g>
                                    </svg></span></span>
                            <div class="info-smq"></div>
                        </span>
                    </div>
                </div>
            </div>
            <div class="button-b2z">
                <div class="container-471">
                    <div class="container-4mp">
                        <div class="group-name-tdh">生成</div>
                        <div class="group-8tw">
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button" @click="handleGenerateVideo">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M5.889 2.112A4.889 4.889 0 0 0 1 7v10a4.89 4.89 0 0 0 4.889 4.89H18.11A4.89 4.89 0 0 0 23 17V7c0-2.7-2.189-4.888-4.889-4.888H5.89ZM3 7a2.889 2.889 0 0 1 2.889-2.888H18.11A2.889 2.889 0 0 1 21 7v10a2.889 2.889 0 0 1-2.889 2.89H5.89A2.889 2.889 0 0 1 3 17V7Zm12.405 4.4c-.175-.386-.7-.68-1.75-1.269l-1.14-.638c-1.01-.565-1.515-.848-1.928-.8a1.29 1.29 0 0 0-.9.527c-.243.337-.243.916-.243 2.073v1.277c0 1.156 0 1.735.243 2.073.213.294.539.485.9.527.413.047.918-.236 1.927-.8l1.14-.64c1.051-.587 1.576-.882 1.751-1.268a1.289 1.289 0 0 0 0-1.061Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">生成视频</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button" @click="handleEditInCanvas">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M6.938 3.125a1 1 0 0 1 1 1v1.813h8.125V4.125a1 1 0 1 1 2 0v1.813h1.812a1 1 0 1 1 0 2h-1.813v2.937a1 1 0 1 1-2 0V7.937H7.938v8.125h2.938a1 1 0 1 1 0 2H7.937v1.813a1 1 0 1 1-2 0v-1.813H4.125a1 1 0 1 1 0-2h1.813V7.938H4.125a1 1 0 0 1 0-2h1.813V4.125a1 1 0 0 1 1-1Zm10.518 17.363.208-.477a3.68 3.68 0 0 1 1.871-1.898l.641-.285a.447.447 0 0 0 0-.812l-.605-.27a3.682 3.682 0 0 1-1.898-1.961l-.213-.515a.427.427 0 0 0-.794 0l-.214.515a3.682 3.682 0 0 1-1.898 1.962l-.605.269a.447.447 0 0 0 0 .812l.64.285a3.675 3.675 0 0 1 1.872 1.898l.208.477c.152.35.635.35.787 0Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">去画布编辑</div>
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="suffix-icon-m9nI7C">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M17.74 12.844a1.2 1.2 0 0 0 0-1.688L9.678 3A1.2 1.2 0 1 0 7.97 4.687L15.2 12l-7.23 7.313A1.2 1.2 0 1 0 9.68 21l8.06-8.156Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                    </button></div>
                            </div>
                        </div>
                    </div>
                    <div class="container-4mp">
                        <div class="group-name-tdh">编辑</div>
                        <div class="group-8tw">
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M20.75 17a1 1 0 0 1 1 1v.806a2.945 2.945 0 0 1-2.944 2.944H5.194a2.945 2.945 0 0 1-2.94-2.793l-.004-.151V18a1 1 0 0 1 1.995-.102L4.25 18v.806l.005.096c.048.476.45.848.94.848h13.61a.945.945 0 0 0 .945-.944V18a1 1 0 0 1 1-1ZM5.077 9a.5.5 0 0 1 .5.5v1.595h2.15V9.5a.5.5 0 0 1 .5-.5h.577a.5.5 0 0 1 .5.5v4.574a.5.5 0 0 1-.5.5h-.577a.5.5 0 0 1-.5-.5V12.4h-2.15v1.674a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1-.5-.5V9.5a.5.5 0 0 1 .5-.5h.577Zm8.004 0c.616 0 1.157.115 1.624.343.467.228.83.549 1.09.963.266.414.4.908.4 1.481 0 .568-.134 1.062-.4 1.482-.26.413-.623.734-1.09.962-.467.229-1.008.343-1.624.343h-2.136a.5.5 0 0 1-.5-.5V9.5a.5.5 0 0 1 .5-.5h2.136Zm6.203.787a.5.5 0 0 1 .5.5V11h.712a.5.5 0 0 1 .5.5v.576a.5.5 0 0 1-.5.5h-.712v.712a.5.5 0 0 1-.5.5h-.576a.5.5 0 0 1-.5-.5v-.712h-.712a.5.5 0 0 1-.5-.5V11.5a.5.5 0 0 1 .5-.5h.712v-.712a.5.5 0 0 1 .499-.5h.577Zm-7.262 3.53h.996c.318 0 .594-.06.828-.176a1.34 1.34 0 0 0 .557-.526 1.65 1.65 0 0 0 .199-.828c0-.324-.066-.6-.199-.828a1.284 1.284 0 0 0-.557-.518 1.767 1.767 0 0 0-.828-.183h-.997v3.058ZM18.805 2.25a2.944 2.944 0 0 1 2.944 2.944V6a1 1 0 0 1-2 0v-.806a.944.944 0 0 0-.944-.944H5.194a.944.944 0 0 0-.944.944V6a1 1 0 0 1-2 0v-.806A2.944 2.944 0 0 1 5.194 2.25h13.612Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">智能超清</div>
                                        <div class="icon-o43"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="12" fill="none" viewBox="0 0 21 12">
                                                <rect width="21" height="12" fill="currentColor" class="model-new-tag_svg__rect-target" rx="4" />
                                                <path fill="currentColor" d="M7.48 8.39h-.287L4.057 4.918V8.39H3.56V3.35h.294l3.129 3.388V3.35h.497zm4.023-1.736h-2.24v.056q.028.68.238.98.224.322.735.322.532 0 1.1-.238l.055.441a3.9 3.9 0 0 1-1.35.259q-1.758 0-1.758-1.897 0-.896.441-1.393.455-.518 1.302-.518 1.477 0 1.477 1.652zM9.998 5.072q-.685 0-.735 1.225h1.358q.028-1.225-.623-1.225m6.149-.322h.994l-1.148 3.64h-.924l-.658-2.87-.61 2.87h-.937l-1.078-3.64h.98l.623 2.94.623-2.94h.889l.665 2.94z" class="model-new-tag_svg__path-target" />
                                            </svg></div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M17.611 3.5A4.89 4.89 0 0 1 22.5 8.389v7.222a4.89 4.89 0 0 1-4.889 4.889H6.39a4.889 4.889 0 0 1-4.882-4.638l-.007-.25V8.388A4.89 4.89 0 0 1 6.39 3.499h11.22ZM6.39 5.5A2.889 2.889 0 0 0 3.5 8.389v7.222l.015.295A2.89 2.89 0 0 0 6.389 18.5H17.61a2.889 2.889 0 0 0 2.889-2.889V8.39a2.889 2.889 0 0 0-2.888-2.89H6.39Zm.89 3.713a.5.5 0 0 1 .5.5v1.595h2.149V9.713a.5.5 0 0 1 .5-.5h.577a.5.5 0 0 1 .5.5v4.574a.5.5 0 0 1-.5.5h-.577a.5.5 0 0 1-.5-.5v-1.674h-2.15v1.674a.5.5 0 0 1-.5.5h-.577a.5.5 0 0 1-.5-.5V9.713a.5.5 0 0 1 .5-.5h.577Zm7.974 0c.616 0 1.157.114 1.624.343.467.228.832.549 1.092.963.265.414.397.908.397 1.481 0 .568-.132 1.062-.397 1.481a2.6 2.6 0 0 1-1.092.963c-.467.228-1.008.343-1.624.343h-2.136a.5.5 0 0 1-.5-.5V9.713a.5.5 0 0 1 .5-.5h2.136Zm-1.059 4.316h.995c.319 0 .595-.059.829-.175.238-.123.424-.298.557-.526a1.65 1.65 0 0 0 .198-.828c0-.324-.065-.6-.198-.828a1.283 1.283 0 0 0-.557-.518 1.765 1.765 0 0 0-.829-.183h-.995v3.058Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">超清</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="m8.792 6.807.154-.353a2.73 2.73 0 0 1 1.386-1.407l.475-.211a.331.331 0 0 0 0-.602l-.448-.2a2.729 2.729 0 0 1-1.407-1.453l-.158-.383a.316.316 0 0 0-.588 0l-.159.383a2.729 2.729 0 0 1-1.406 1.453l-.449.2a.332.332 0 0 0 0 .602l.475.21a2.727 2.727 0 0 1 1.387 1.408l.154.353c.113.26.47.26.584 0Zm5.398.832L17 4.829l2.121 2.12-2.824 2.825-2.107-2.135Zm-1.415 1.414-7.442 7.443a1.5 1.5 0 1 0 2.121 2.121l7.43-7.43-2.109-2.134Zm3.219-6.047a1.423 1.423 0 0 1 2.012 0l2.938 2.938a1.423 1.423 0 0 1 0 2.012L8.868 20.03a3.5 3.5 0 1 1-4.95-4.95L15.994 3.007Zm3.108 17.13-.208.477a.427.427 0 0 1-.788 0l-.208-.477a3.68 3.68 0 0 0-1.87-1.898l-.641-.285a.447.447 0 0 1 0-.812l.604-.27a3.682 3.682 0 0 0 1.899-1.96l.213-.516a.427.427 0 0 1 .794 0l.213.515a3.682 3.682 0 0 0 1.899 1.962l.604.269a.447.447 0 0 1 0 .812l-.64.285a3.68 3.68 0 0 0-1.871 1.898Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">细节修复</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8.562 2.973c-.17.061-.336.127-.5.196a1.006 1.006 0 0 0-.536 1.313.994.994 0 0 0 1.306.532 8.16 8.16 0 0 1 .81-.293c.53-.16.83-.72.672-1.25a.994.994 0 0 0-1.243-.667c-.17.051-.34.108-.51.17ZM6.087 6.937a1.003 1.003 0 0 0-.046-1.416.997.997 0 0 0-1.411.052c-.246.264-.476.54-.69.827a.998.998 0 1 0 1.595 1.2c.171-.231.356-.452.552-.663Zm7.149-4.483a1.003 1.003 0 0 0-1.12.865.997.997 0 0 0 .858 1.121c.285.037.567.09.845.156a1.002 1.002 0 0 0 .472-1.948 9.983 9.983 0 0 0-1.055-.194Zm4.818 1.986a1.003 1.003 0 0 0-1.215 1.595c.228.173.446.36.655.558.4.38 1.032.36 1.411-.042a1.004 1.004 0 0 0-.036-1.416 9.937 9.937 0 0 0-.815-.695Zm-13.94 6.207a.998.998 0 1 0-1.943-.45c-.082.349-.145.702-.19 1.06a.996.996 0 0 0 .868 1.114 1.004 1.004 0 0 0 1.114-.874c.036-.286.087-.57.152-.85Zm1.55 9.323-.208.477a.427.427 0 0 1-.787 0l-.208-.477a3.68 3.68 0 0 0-1.871-1.898l-.641-.285a.447.447 0 0 1 0-.812l.605-.27a3.681 3.681 0 0 0 1.898-1.96l.213-.516a.427.427 0 0 1 .794 0l.214.515a3.682 3.682 0 0 0 1.898 1.962l.605.269a.447.447 0 0 1 0 .812l-.64.285a3.68 3.68 0 0 0-1.872 1.898ZM20.185 7.248c.664-.669 1.8-.197 1.802.75l.013 5c.001.449-.175.88-.49 1.196l-2.705 2.727-.485-1.19a4.518 4.518 0 0 0-.983-1.472 4.478 4.478 0 0 0-1.46-.99l-1.18-.489 5.488-5.532ZM8.392 20.728s.02.027.073.071c.151.13.575.408 1.582.621.643.137 1.523.247 2.72.275 1.858.044 2.998-.493 3.912-1.28 1.59-1.373 1.367-4.018-.114-5.51-1.428-1.44-3.747-1.513-5.09.008-.166.188-.33.378-.486.568-.596.724-.87 1.576-1.148 2.437-.318.984-.64 1.98-1.449 2.81Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">局部重绘</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 25 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M7.5 10a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4Zm3-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM3 3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H5v1a1 1 0 0 1-2 0v-2Zm1 18a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2H4Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    <path data-follow-fill="currentColor" d="M3.293 2.793a1 1 0 0 1 1.414 0l2.701 2.701a1 1 0 0 1-1.414 1.414l-2.701-2.7a1 1 0 0 1 0-1.415Zm0 18.414a1 1 0 0 1 0-1.414l2.701-2.701a1 1 0 0 1 1.414 1.414l-2.7 2.701a1 1 0 0 1-1.415 0ZM22 3.5a1 1 0 0 0-1-1h-2a1 1 0 1 0 0 2h1v1a1 1 0 1 0 2 0v-2Zm-1 18a1 1 0 0 0 1-1v-2a1 1 0 1 0-2 0v1h-1a1 1 0 1 0 0 2h2Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    <path data-follow-fill="currentColor" d="M21.707 2.793a1 1 0 0 0-1.414 0l-2.701 2.701a1 1 0 0 0 1.414 1.414l2.701-2.7a1 1 0 0 0 0-1.415Zm0 18.414a1 1 0 0 0 0-1.414l-2.701-2.701a1 1 0 0 0-1.414 1.414l2.7 2.701a1 1 0 0 0 1.415 0Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">扩图</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M17.869 2.995a3.399 3.399 0 0 0-4.807 0l-7.066 7.067a3.4 3.4 0 0 0 0 4.807l3.135 3.136a3.399 3.399 0 0 0 4.807 0l7.066-7.067a3.4 3.4 0 0 0 0-4.808L17.87 2.995Zm-10.271 8.67 3.545-3.531 4.738 4.738-3.546 3.53a1.133 1.133 0 0 1-1.602 0l-3.135-3.135a1.133 1.133 0 0 1 0-1.603Zm-3.265 4.502a1.167 1.167 0 1 1-2.333 0 1.167 1.167 0 0 1 2.333 0Zm0 4.666a1.167 1.167 0 1 1-2.333 0 1.167 1.167 0 0 1 2.333 0ZM9 19.667a1.167 1.167 0 1 1-2.333 0 1.167 1.167 0 0 1 2.333 0Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">消除笔</div>
                                    </button></div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M16.092 5.86c1.905.08 3.113 1.362 3.96 2.47.225.293.437.592.634.87.2.282.383.54.565.779.377.492.674.793.941.946a1 1 0 0 1 .408 1.294c-.684 1.448-1.687 3.317-3.349 4.82-1.69 1.528-4.017 2.639-7.25 2.639-6.143 0-9.079-3.976-10.386-6.944l-.24-.579a1 1 0 0 1 .271-1.114l.262-.249c.267-.272.553-.612.874-1.01.41-.509.878-1.115 1.363-1.665.937-1.059 2.233-2.26 3.939-2.26l.3.004c1.47.05 2.55.48 3.418 1.24l.053.037a.391.391 0 0 0 .189.054.295.295 0 0 0 .202-.064l.172-.143c.875-.693 1.96-1.129 3.487-1.129l.187.004Zm-.398 2c-.889.033-1.469.272-1.937.619l-.21.167c-.845.725-2.057.702-2.899.09l-.163-.13c-.44-.386-1.01-.67-1.966-.736l-.435-.014c-.747 0-1.515.54-2.44 1.586-.446.503-.858 1.04-1.304 1.594-.27.334-.556.675-.85.99 1.148 2.559 3.547 5.652 8.511 5.652 2.722 0 4.574-.916 5.908-2.122 1.132-1.024 1.92-2.286 2.53-3.478a7.654 7.654 0 0 1-.776-.884 28.48 28.48 0 0 1-.61-.838c-.198-.28-.39-.55-.588-.81-.816-1.067-1.554-1.69-2.56-1.69l-.21.004ZM7.51 12.114a.9.9 0 0 1 1.228-.333l.144.077c.746.377 1.888.602 3.111.606 1.305.003 2.514-.246 3.247-.663l.082-.042a.899.899 0 0 1 .807 1.605l-.214.115c-1.094.552-2.554.79-3.93.786-1.47-.005-3.031-.284-4.144-.922l-.077-.05a.9.9 0 0 1-.254-1.179Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">对口型</div>
                                    </button></div>
                            </div>
                        </div>
                    </div>
                    <div class="container-4mp">
                        <div class="group-name-tdh">更多</div>
                        <div class="group-8tw">
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button" @click="openEditArea">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M3.764 8.02a2.5 2.5 0 0 1 2.5-2.5H17.03a2.5 2.5 0 0 1 2.5 2.5V9.8a3.25 3.25 0 0 1 2-.082V8.019a4.5 4.5 0 0 0-4.5-4.5H6.264a4.5 4.5 0 0 0-4.5 4.5v7.932a4.5 4.5 0 0 0 4.5 4.5h5.837a2.436 2.436 0 0 1-.05-.57v-1.43H6.263a2.5 2.5 0 0 1-2.5-2.5V8.019Zm17.67 3.964a1 1 0 0 0-1.41-.004l-5.773 5.707a.25.25 0 0 0-.074.178v2.366c0 .138.112.25.25.25h2.347a.25.25 0 0 0 .178-.075l5.71-5.791a1 1 0 0 0-.006-1.41l-1.221-1.22Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">重新编辑</div>
                                    </button></div>
                            </div>
                            <div>
                                <div>
                                    <div class="container-36h">
                                        <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                                <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                        <g>
                                                            <path data-follow-fill="currentColor" d="m8.56 5.726 3.948-2.776a.5.5 0 0 1 .788.41v2.23h2.72v2H9.187a.996.996 0 0 1-.631-.225c-.518-.367-.61-1.208.003-1.64Zm10.775 9.213a1 1 0 1 0 1.5 1.323 6.403 6.403 0 0 0 1.605-4.249 6.403 6.403 0 0 0-1.606-4.249 6.41 6.41 0 0 0-4.817-2.174v2a4.41 4.41 0 0 1 3.318 1.498 4.403 4.403 0 0 1 1.105 2.925 4.403 4.403 0 0 1-1.105 2.926Zm-14.67-5.88a1 1 0 1 0-1.5-1.323 6.403 6.403 0 0 0-1.605 4.249c0 1.628.607 3.117 1.606 4.25a6.41 6.41 0 0 0 4.817 2.174v-2a4.41 4.41 0 0 1-3.318-1.498 4.403 4.403 0 0 1-1.105-2.926c0-1.123.416-2.145 1.105-2.926Zm3.318 9.35h2.404v2.232a.5.5 0 0 0 .788.409l3.962-2.785a.816.816 0 0 0 .066-.05.999.999 0 0 0-.591-1.806H7.983v2Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                        </g>
                                                    </svg></div>
                                                <div class="text-4lg">再次生成</div>
                                            </button></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="container-jzo"><button class="btn-kl4 btn-secondary-3gh btn-o3f btn-elv button-1bb" type="button">
                                        <div class="icon-9no"><svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                <g>
                                                    <path data-follow-fill="currentColor" d="M12 1a1 1 0 0 1 1 1v1.057A9 9 0 0 1 20.943 11h1.053a1 1 0 0 1 0 2h-1.053A9 9 0 0 1 13 20.942v1.054a1 1 0 0 1-2 0v-1.054A9 9 0 0 1 3.057 13H2a1 1 0 1 1 0-2h1.057A9 9 0 0 1 11 3.057V2a1 1 0 0 1 1-1Zm1 6.127a1 1 0 1 1-2 0V5.072A7.002 7.002 0 0 0 5.072 11h2.055a1 1 0 1 1 0 2H5.072A7.001 7.001 0 0 0 11 18.927v-2.058a1 1 0 0 1 2 0v2.058A7.001 7.001 0 0 0 18.928 13h-2.059a1 1 0 0 1 0-2h2.059A7.002 7.002 0 0 0 13 5.072v2.055Z" fill="currentColor" />
                                                </g>
                                            </svg></div>
                                        <div class="text-4lg">在生成页定位</div>
                                    </button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 定义图片类型
interface ImageItem {
  id: string
  src: string
}

// 定义 Props
interface Props {
  visible: boolean
  currentIndex: number
  images: ImageItem[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  currentIndex: 0,
  images: () => []
})

// 定义 Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:currentIndex': [value: number]
  'download': [image: ImageItem]
  'favorite': [image: ImageItem]
  'publish': [image: ImageItem]
  'generateVideo': [image: ImageItem]
  'editInCanvas': [image: ImageItem]
}>()

// 当前图片索引（内部状态）
const internalIndex = ref(props.currentIndex)

// 控制编辑区域显示
const showEditArea = ref(false)

// 当前图片
const currentImage = computed(() => {
  if (props.images.length === 0) return null
  return props.images[internalIndex.value] || props.images[0]
})

// 总图片数
const totalImages = computed(() => props.images.length)

// 监听外部 currentIndex 变化
watch(() => props.currentIndex, (newIndex) => {
  internalIndex.value = newIndex
})

// 监听内部 index 变化，同步到外部
watch(internalIndex, (newIndex) => {
  emit('update:currentIndex', newIndex)
})

// 关闭预览
const closePreview = () => {
  emit('update:visible', false)
  // 关闭时重置编辑区域状态
  showEditArea.value = false
}

// 上一张
const prevImage = () => {
  if (internalIndex.value > 0) {
    internalIndex.value--
  }
}

// 下一张
const nextImage = () => {
  if (internalIndex.value < props.images.length - 1) {
    internalIndex.value++
  }
}

// 打开编辑区域
const openEditArea = () => {
  showEditArea.value = true
}

// 下载图片
const handleDownload = () => {
  if (currentImage.value) {
    emit('download', currentImage.value)
  }
}

// 收藏图片
const handleFavorite = () => {
  if (currentImage.value) {
    emit('favorite', currentImage.value)
  }
}

// 发布图片
const handlePublish = () => {
  if (currentImage.value) {
    emit('publish', currentImage.value)
  }
}

// 生成视频
const handleGenerateVideo = () => {
  if (currentImage.value) {
    emit('generateVideo', currentImage.value)
  }
}

// 去画布编辑
const handleEditInCanvas = () => {
  if (currentImage.value) {
    emit('editInCanvas', currentImage.value)
  }
}
</script>

<style>
@import "./ImagePreview.css";
</style>
