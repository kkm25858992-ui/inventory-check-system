/* =========================================================
   숫자 처리
========================================================= */

function cleanNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }


    return parseFloat(
        String(value)
            .replace(/,/g, "")
            .trim()
    ) || 0;

}


/* =========================================================
   문자열
========================================================= */

function cleanText(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }

    return String(value).trim();

}


/* =========================================================
   숫자 표시
========================================================= */

function formatNumber(value){

    const number =
        cleanNumber(value);


    if(
        Number.isInteger(number)
    ){

        return number.toLocaleString();

    }


    return number.toLocaleString(
        undefined,
        {
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   HTML 안전 처리
========================================================= */

function escapeHtml(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   로컬 저장
========================================================= */

function saveLocal(){

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(data)
    );


    localStorage.setItem(
        "inventoryMasterData",
        JSON.stringify(masterData)
    );

}


/* =========================================================
   완료 개수
========================================================= */

function updateCompletedCount(){

    completedCount =
        data.length;

}


/* =========================================================
   메인 렌더링
========================================================= */

function render(){

    updateCompletedCount();


    /*
        아직 랙을 선택하지 않은 경우
    */

    if(!currentRack){

        renderRackScan();

        return;

    }


    /*
        제품을 선택한 경우
    */

    if(currentProduct){

        renderQuantity();

        return;

    }


    /*
        랙 선택 후
        제품 스캔
    */

    renderProductScan();

}


/* =========================================================
   랙 스캔 화면
========================================================= */

function renderRackScan(){

    currentProduct = null;


    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">

            <div class="scan-title">

                랙 바코드를 스캔하세요

            </div>


            <div class="scan-message">

                PDA 스캐너로 랙 바코드를
                스캔해주세요.

            </div>


            <input
                id="rackInput"
                placeholder="랙 바코드"
                autocomplete="off"
                autofocus
            >


            <button
                onclick="confirmRack()"
            >

                랙 확인

            </button>


            <div class="quantity-result">

                <div class="quantity-result-label">

                    현재 조사 건수

                </div>


                <div class="quantity-result-value">

                    ${completedCount}

                </div>

            </div>


            ${
                completedCount > 0
                ?

                `

                <button
                    class="download-button"
                    onclick="download()"
                >
                    엑셀 다운로드
                </button>


                <button
                    class="share-button"
                    onclick="share()"
                >
                    엑셀 공유
                </button>


                <button
                    class="qr-button"
                    onclick="createQR()"
                >
                    QR코드 생성
                </button>

                `

                :

                ""

            }

        </div>

    `;


    const input =
        document.getElementById(
            "rackInput"
        );


    if(input){

        input.focus();


        input.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Enter"
                ){

                    event.preventDefault();

                    confirmRack();

                }

            }
        );

    }

}


/* =========================================================
   랙 확인
========================================================= */

function confirmRack(){

    const input =
        document.getElementById(
            "rackInput"
        );


    if(!input){

        return;

    }


    const rack =
        cleanText(
            input.value
        );


    if(!rack){

        alert(
            "랙 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    currentRack =
        rack;


    currentProduct =
        null;


    saveLocal();


    render();

}


/* =========================================================
   제품 스캔 화면
========================================================= */

function renderProductScan(){

    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">


            <div class="current-rack">

                <div class="current-rack-title">

                    현재 랙

                </div>


                <div class="current-rack-value">

                    ${escapeHtml(
                        currentRack
                    )}

                </div>

            </div>


            <div class="scan-title">

                제품 바코드를 스캔하세요

            </div>


            <div class="scan-message">

                제품을 스캔하면
                상품정보가 자동으로 표시됩니다.

            </div>


            <input
                id="productInput"
                placeholder="제품 바코드"
                inputmode="numeric"
                autocomplete="off"
                autofocus
            >


            <button
                onclick="confirmProduct()"
            >

                제품 확인

            </button>


            <button
                class="gray-button"
                onclick="changeRack()"
            >

                다른 랙

            </button>


            <div class="quantity-result">

                <div class="quantity-result-label">

                    조사 완료 건수

                </div>


                <div class="quantity-result-value">

                    ${completedCount}

                </div>

            </div>


            ${
                completedCount > 0
                ?

                `

                <button
                    class="download-button"
                    onclick="download()"
                >

                    엑셀 다운로드

                </button>


                <button
                    class="share-button"
                    onclick="share()"
                >

                    엑셀 공유

                </button>

                `

                :

                ""

            }

        </div>

    `;


    const input =
        document.getElementById(
            "productInput"
        );


    if(input){

        input.focus();


        input.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Enter"
                ){

                    event.preventDefault();

                    confirmProduct();

                }

            }
        );

    }

}


/* =========================================================
   제품 바코드 검색
========================================================= */

function findMasterProduct(
    barcode
){

    const normalized =
        cleanText(barcode);


    return masterData.find(
        item =>
            cleanText(
                item["바코드"]
            ) === normalized
    );

}


/* =========================================================
   제품 확인
========================================================= */

function confirmProduct(){

    const input =
        document.getElementById(
            "productInput"
        );


    if(!input){

        return;

    }


    const barcode =
        cleanText(
            input.value
        );


    if(!barcode){

        alert(
            "제품 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    /*
        시트2에서 바코드 검색
    */

    const master =
        findMasterProduct(
            barcode
        );


    if(!master){

        alert(
            "시트2에 등록되지 않은 제품입니다.\n\n" +
            "바코드 : " +
            barcode
        );


        input.value = "";

        input.focus();

        return;

    }


    /*
        상품정보 자동 매칭
    */

    currentProduct = {

        "바코드":
            cleanText(
                master["바코드"]
            ),

        "랙":
            currentRack,

        "소비기한":
            "",

        "수량":
            0,

        "상품명":
            cleanText(
                master["상품명"]
            ),

        "화주사":
            cleanText(
                master["화주사"]
            ),

        "입수량":
            cleanNumber(
                master["입수량"]
            ),

        "박스수량":
            "",

        "낱개수량":
            "",

        "실수량":
            0

    };


    renderQuantity();

}


/* =========================================================
   수량 입력 화면
========================================================= */

function renderQuantity(){

    if(!currentProduct){

        renderProductScan();

        return;

    }


    const item =
        currentProduct;


    const unitQty =
        cleanNumber(
            item["입수량"]
        );


    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">


            <div class="current-rack">

                <div class="current-rack-title">

                    현재 랙

                </div>


                <div class="current-rack-value">

                    ${escapeHtml(
                        item["랙"]
                    )}

                </div>

            </div>


            <div class="info-row">

                <span class="info-label">
                    바코드
                </span>


                <span class="info-value">

                    ${escapeHtml(
                        item["바코드"]
                    )}

                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>


                <span class="info-value">

                    ${escapeHtml(
                        item["상품명"]
                    )}

                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    화주사
                </span>


                <span class="info-value">

                    ${escapeHtml(
                        item["화주사"]
                    )}

                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>


                <span class="info-value">

                    ${formatNumber(
                        unitQty
                    )}

                </span>

            </div>


            <!-- 소비기한 -->

            <div class="quantity-title">

                소비기한

            </div>


            <input
                id="expiryInput"
                type="date"
                value="${escapeHtml(
                    item["소비기한"]
                )}"
            >


            <!-- 수량 -->

            <div class="quantity-title">

                수량 입력

            </div>


            ${
                unitQty > 0

                ?

                `

                <input
                    id="boxInput"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="박스 수량"
                    autocomplete="off"
                >


                <input
                    id="eachInput"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="낱개 수량"
                    autocomplete="off"
                >

                `

                :

                `

                <input
                    id="eachInput"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="실제 수량"
                    autocomplete="off"
                >

                `
            }


            <div class="quantity-result">

                <div class="quantity-result-label">

                    실수량

                </div>


                <div
                    id="realQty"
                    class="quantity-result-value"
                >

                    0

                </div>

            </div>


            <button
                onclick="registerProduct()"
            >

                수량 등록

            </button>


            <button
                class="gray-button"
                onclick="cancelProduct()"
            >

                다시 스캔

            </button>

        </div>

    `;


    /*
        소비기한
    */

    const expiry =
        document.getElementById(
            "expiryInput"
        );


    /*
        박스
    */

    const box =
        document.getElementById(
            "boxInput"
        );


    /*
        낱개
    */

    const each =
        document.getElementById(
            "eachInput"
        );


    if(box){

        box.addEventListener(
            "input",
            calculateQuantity
        );


        box.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Enter"
                ){

                    event.preventDefault();

                    if(each){

                        each.focus();

                    }

                }

            }
        );

    }


    if(each){

        each.addEventListener(
            "input",
            calculateQuantity
        );


        each.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Enter"
                ){

                    event.preventDefault();

                    registerProduct();

                }

            }
        );

    }


    /*
        소비기한 변경
    */

    if(expiry){

        expiry.addEventListener(
            "change",
            function(){

                currentProduct["소비기한"] =
                    expiry.value;

            }
        );

    }


    /*
        처음에는 소비기한에 포커스
    */

    if(expiry){

        expiry.focus();

    }


    calculateQuantity();

}


/* =========================================================
   수량 계산
========================================================= */

function calculateQuantity(){

    if(!currentProduct){

        return;

    }


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    let realQty = 0;


    /*
        입수량 있음
    */

    if(unitQty > 0){

        const box =
            cleanNumber(
                document.getElementById(
                    "boxInput"
                )?.value
            );


        const each =
            cleanNumber(
                document.getElementById(
                    "eachInput"
                )?.value
            );


        realQty =
            (
                unitQty *
                box
            ) + each;


        currentProduct["박스수량"] =
            box;


        currentProduct["낱개수량"] =
            each;

    }


    /*
        입수량 없음
    */

    else{

        realQty =
            cleanNumber(
                document.getElementById(
                    "eachInput"
                )?.value
            );

    }


    currentProduct["실수량"] =
        realQty;


    const display =
        document.getElementById(
            "realQty"
        );


    if(display){

        display.innerText =
            formatNumber(
                realQty
            );

    }

}


/* =========================================================
   상품 등록
========================================================= */

function registerProduct(){

    if(!currentProduct){

        return;

    }


    /*
        소비기한
    */

    const expiry =
        document.getElementById(
            "expiryInput"
        );


    if(!expiry || !expiry.value){

        alert(
            "소비기한을 입력해주세요."
        );

        if(expiry){

            expiry.focus();

        }

        return;

    }


    currentProduct["소비기한"] =
        expiry.value;


    /*
        수량 다시 계산
    */

    calculateQuantity();


    const realQty =
        cleanNumber(
            currentProduct["실수량"]
        );


    /*
        수량 확인
    */

    if(realQty < 0){

        alert(
            "수량을 확인해주세요."
        );

        return;

    }


    /*
        조사 결과에 새 행 추가
    */

    data.push({

        "바코드":
            currentProduct["바코드"],

        "랙":
            currentProduct["랙"],

        "소비기한":
            currentProduct["소비기한"],

        "수량":
            realQty,

        "상품명":
            currentProduct["상품명"],

        "화주사":
            currentProduct["화주사"],

        "입수량":
            currentProduct["입수량"],

        "박스수량":
            currentProduct["박스수량"],

        "낱개수량":
            currentProduct["낱개수량"]

    });


    /*
        로컬 저장
    */

    saveLocal();


    updateCompletedCount();


    /*
        현재 제품 초기화
    */

    currentProduct =
        null;


    /*
        계속 같은 랙에서
        다음 제품 스캔
    */

    renderProductScan();

}


/* =========================================================
   제품 취소
========================================================= */

function cancelProduct(){

    currentProduct =
        null;


    renderProductScan();

}


/* =========================================================
   다른 랙
========================================================= */

function changeRack(){

    currentRack =
        "";


    currentProduct =
        null;


    renderRackScan();

}


/* =========================================================
   조사 결과 다운로드
========================================================= */

function download(){

    if(data.length === 0){

        alert(
            "아직 조사한 데이터가 없습니다."
        );

        return;

    }


    saveExcel()
        .then(
            fileId => {

                if(!fileId){

                    return;

                }


                window.location =
                    "/download/" +
                    fileId;

            }
        );

}


/* =========================================================
   서버 저장 공통
========================================================= */

function saveExcel(){

    return fetch(
        "/save",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify({

                    inventory:
                        data,

                    master:
                        masterData

                })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if(result.error){

                alert(
                    "저장 실패\n\n" +
                    result.error
                );

                return null;

            }


            return result.file_id;

        }
    )

    .catch(
        error => {

            console.error(
                error
            );


            alert(
                "서버 저장 중 오류가 발생했습니다."
            );


            return null;

        }
    );

}


/* =========================================================
   공유
========================================================= */

function share(){

    if(data.length === 0){

        alert(
            "아직 조사한 데이터가 없습니다."
        );

        return;

    }


    saveExcel()
        .then(
            fileId => {

                if(!fileId){

                    return;

                }


                const url =
                    location.origin +
                    "/share/" +
                    fileId;


                /*
                    PDA 공유
                */

                if(
                    navigator.share
                ){

                    navigator.share({

                        title:
                            "재고조사 결과",

                        text:
                            "재고조사 파일 다운로드",

                        url:
                            url

                    }).catch(
                        () => {}
                    );


                    return;

                }


                /*
                    클립보드
                */

                if(
                    navigator.clipboard
                ){

                    navigator.clipboard
                        .writeText(url)
                        .then(
                            function(){

                                alert(
                                    "다운로드 링크가 복사되었습니다."
                                );

                            }
                        )
                        .catch(
                            function(){

                                showManualCopy(
                                    url
                                );

                            }
                        );

                }else{

                    showManualCopy(
                        url
                    );

                }

            }
        );

}


/* =========================================================
   수동 링크
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById(
            "app"
        );


    const div =
        document.createElement(
            "div"
        );


    div.innerHTML = `

        <div class="card">

            <p>
                <b>
                    다운로드 링크
                </b>
            </p>


            <p>
                아래 링크를 복사하세요.
            </p>


            <input
                value="${escapeHtml(url)}"
                readonly
                onclick="this.select()"
            >

        </div>

    `;


    app.prepend(div);

}


/* =========================================================
   QR 코드
========================================================= */

function createQR(){

    if(data.length === 0){

        alert(
            "아직 조사한 데이터가 없습니다."
        );

        return;

    }


    saveExcel()
        .then(
            fileId => {

                if(!fileId){

                    return;

                }


                const qrUrl =
                    "/qr/" +
                    fileId;


                const old =
                    document.getElementById(
                        "qr-box"
                    );


                if(old){

                    old.remove();

                }


                const div =
                    document.createElement(
                        "div"
                    );


                div.id =
                    "qr-box";


                div.innerHTML = `

                    <div class="card">

                        <h3
                            style="
                                text-align:center;
                            "
                        >

                            QR코드

                        </h3>


                        <img
                            src="${qrUrl}"
                            style="
                                width:250px;
                                max-width:100%;
                                display:block;
                                margin:auto;
                            "
                        >


                        <p
                            style="
                                text-align:center;
                            "
                        >

                            QR 스캔 시
                            엑셀 다운로드

                        </p>


                        <button
                            class="danger-button"
                            onclick="closeQR()"
                        >

                            닫기

                        </button>

                    </div>

                `;


                document
                    .getElementById(
                        "app"
                    )
                    .appendChild(div);

            }
        );

}


/* =========================================================
   QR 닫기
========================================================= */

function closeQR(){

    const qrBox =
        document.getElementById(
            "qr-box"
        );


    if(qrBox){

        qrBox.remove();

    }

}


/* =========================================================
   신규 재고
========================================================= */

function addNewItem(){

    alert(
        "현재 버전에서는 신규 재고도\n" +
        "랙 → 제품 바코드 스캔 방식으로 등록합니다."
    );

}


/* =========================================================
   페이지 종료 전 저장
========================================================= */

window.addEventListener(
    "beforeunload",
    function(){

        saveLocal();

    }
);
