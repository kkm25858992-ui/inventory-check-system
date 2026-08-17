/* =========================================================
   재고조사 script.js
========================================================= */


/* =========================================================
   전역 변수
========================================================= */

let currentStep = "rack";

let currentRack = "";

let currentProduct = null;

let currentExpiry = "";

let mappingData =
    Array.isArray(mapping)
        ? mapping
        : [];


/* =========================================================
   숫자 변환
========================================================= */

function cleanNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    let number = parseFloat(
        String(value)
            .replace(/,/g, "")
            .trim()
    );

    return isNaN(number)
        ? 0
        : number;
}


/* =========================================================
   문자열 변환
========================================================= */

function cleanString(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


/* =========================================================
   숫자 표시
========================================================= */

function formatNumber(value) {

    return cleanNumber(value).toLocaleString(
        "ko-KR"
    );

}


/* =========================================================
   HTML 안전 처리
========================================================= */

function escapeHtml(value) {

    return cleanString(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   LocalStorage 저장
========================================================= */

function saveLocal() {

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(data)
    );

    localStorage.setItem(
        "mappingData",
        JSON.stringify(mappingData)
    );

}


/* =========================================================
   메인 화면
========================================================= */

function render() {

    const app =
        document.getElementById("app");

    if (!app) {
        return;
    }


    app.innerHTML = `

        <div class="card">

            <div class="step-title">
                재고조사
            </div>


            <div class="progress-text">

                현재 등록 건수 :
                ${data.length}

            </div>


            <div class="progress-bg">

                <div
                    class="progress-bar"
                    style="width:100%;"
                ></div>

            </div>


            <div id="scanArea"></div>

        </div>


        <div class="card">

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
                class="share-button"
                onclick="createQR()"
            >
                QR코드 생성
            </button>

        </div>

    `;


    renderRackStep();

}


/* =========================================================
   1단계
   랙 바코드
========================================================= */

function renderRackStep() {

    currentStep = "rack";

    currentRack = "";

    currentProduct = null;

    currentExpiry = "";


    const area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            1. 랙 바코드 스캔

        </div>


        <input
            id="rackBarcode"
            placeholder="랙 바코드를 스캔하세요"
            autocomplete="off"
            inputmode="text"
        >


        <button
            class="product-button"
            onclick="confirmRack()"
        >
            랙 확인
        </button>

    `;


    const input =
        document.getElementById(
            "rackBarcode"
        );


    input.focus();


    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                confirmRack();

            }

        }
    );

}


/* =========================================================
   랙 확인
========================================================= */

function confirmRack() {

    const input =
        document.getElementById(
            "rackBarcode"
        );


    if (!input) {
        return;
    }


    const rack =
        cleanString(
            input.value
        );


    if (!rack) {

        alert(
            "랙 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    currentRack = rack;


    renderProductStep();

}


/* =========================================================
   2단계
   제품 바코드
========================================================= */

function renderProductStep() {

    currentStep = "product";


    const area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            2. 제품 바코드 스캔

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    현재 랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>

        </div>


        <input
            id="productBarcode"
            placeholder="제품 바코드를 스캔하세요"
            autocomplete="off"
            inputmode="text"
        >


        <button
            class="product-button"
            onclick="confirmProduct()"
        >
            제품 확인
        </button>

    `;


    const input =
        document.getElementById(
            "productBarcode"
        );


    input.focus();


    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                confirmProduct();

            }

        }
    );

}


/* =========================================================
   제품 확인
========================================================= */

function confirmProduct() {

    const input =
        document.getElementById(
            "productBarcode"
        );


    if (!input) {
        return;
    }


    let barcode =
        cleanString(
            input.value
        );


    if (!barcode) {

        alert(
            "제품 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    /*
       PDA가 숫자 뒤에 .0을 붙이는 경우 처리
    */

    barcode =
        barcode.replace(
            /\.0$/,
            ""
        );


    const found =
        findProduct(
            barcode
        );


    if (!found) {

        alert(
            "시트2에서 해당 제품 바코드를 찾을 수 없습니다."
        );

        input.value = "";

        input.focus();

        return;

    }


    currentProduct = {

        바코드:
            barcode,

        화주사:
            cleanString(
                found.화주사
            ),

        입수량:
            cleanNumber(
                found.입수량
            ),

        상품명:
            cleanString(
                found.상품명
            )

    };


    renderExpiryStep();

}


/* =========================================================
   시트2 상품 검색
========================================================= */

function findProduct(barcode) {

    const target =
        cleanString(
            barcode
        )
        .replace(
            /\.0$/,
            ""
        );


    for (
        let i = 0;
        i < mappingData.length;
        i++
    ) {

        const item =
            mappingData[i];


        let itemBarcode =
            cleanString(
                item.바코드
            )
            .replace(
                /\.0$/,
                ""
            );


        if (
            itemBarcode === target
        ) {

            return item;

        }

    }


    return null;

}


/* =========================================================
   3단계
   소비기한
========================================================= */

function renderExpiryStep() {

    currentStep = "expiry";

    currentExpiry = "";


    const area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            3. 소비기한 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    화주사
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.화주사)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>

        </div>


        <input
            id="expiryDate"
            placeholder="YYYY-MM-DD"
            maxlength="10"
            inputmode="numeric"
            autocomplete="off"
        >

    `;


    const input =
        document.getElementById(
            "expiryDate"
        );


    input.focus();


    input.addEventListener(
        "input",
        handleExpiryInput
    );


    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                if (
                    input.value.length === 10
                ) {

                    currentExpiry =
                        input.value;

                    renderBoxStep();

                }

            }

        }
    );

}


/* =========================================================
   소비기한 입력
   2026
   ↓
   2026-
   ↓
   2026-08
   ↓
   2026-08-
   ↓
   2026-08-17
   ↓
   자동 박스수 이동
========================================================= */

function handleExpiryInput() {

    const input =
        document.getElementById(
            "expiryDate"
        );


    if (!input) {
        return;
    }


    let value =
        input.value
            .replace(/\D/g, "")
            .substring(0, 8);


    let result = "";


    if (
        value.length <= 4
    ) {

        result = value;

    }
    else if (
        value.length <= 6
    ) {

        result =
            value.substring(0, 4)
            +
            "-"
            +
            value.substring(4, 6);

    }
    else {

        result =
            value.substring(0, 4)
            +
            "-"
            +
            value.substring(4, 6)
            +
            "-"
            +
            value.substring(6, 8);

    }


    input.value = result;


    currentExpiry = result;


    localStorage.setItem(
        "currentExpiry",
        currentExpiry
    );


    /*
       YYYY-MM-DD 8자리 입력 완료
    */

    if (
        value.length === 8
    ) {

        setTimeout(
            function () {

                currentExpiry =
                    input.value;

                renderBoxStep();

            },
            150
        );

    }

}


/* =========================================================
   4단계
   박스수
========================================================= */

function renderBoxStep() {

    currentStep = "box";


    const area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            4. 박스수 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    소비기한
                </span>

                <span class="info-value">
                    ${escapeHtml(currentExpiry)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>

        </div>


        <input
            id="boxQty"
            placeholder="박스수"
            inputmode="numeric"
            autocomplete="off"
        >


        <div class="total-box">

            <div class="total-title">
                현재 계산 수량
            </div>


            <div
                id="boxTotalQty"
                class="total-value"
            >
                0
            </div>

        </div>

    `;


    const input =
        document.getElementById(
            "boxQty"
        );


    input.focus();


    input.addEventListener(
        "input",
        updateBoxTotal
    );


    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                renderEachStep();

            }

        }
    );

}


/* =========================================================
   박스수 계산
========================================================= */

function updateBoxTotal() {

    const input =
        document.getElementById(
            "boxQty"
        );


    if (!input) {
        return;
    }


    const boxQty =
        cleanNumber(
            input.value
        );


    const unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    const total =
        unitQty *
        boxQty;


    const output =
        document.getElementById(
            "boxTotalQty"
        );


    if (output) {

        output.innerText =
            formatNumber(total);

    }

}


/* =========================================================
   5단계
   낱개수량
========================================================= */

function renderEachStep() {

    currentStep = "each";


    const area =
        document.getElementById(
            "scanArea"
        );


    const boxInput =
        document.getElementById(
            "boxQty"
        );


    const boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    const boxTotal =
        cleanNumber(
            currentProduct.입수량
        )
        *
        boxQty;


    area.innerHTML = `

        <div class="step-title">

            5. 낱개수량 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    소비기한
                </span>

                <span class="info-value">
                    ${escapeHtml(currentExpiry)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    박스수
                </span>

                <span class="info-value">
                    ${formatNumber(boxQty)}
                </span>

            </div>

        </div>


        <input
            id="eachQty"
            placeholder="낱개수량"
            inputmode="numeric"
            autocomplete="off"
        >


        <div class="total-box">

            <div class="total-title">
                최종 수량
            </div>


            <div
                id="finalTotalQty"
                class="total-value"
            >
                ${formatNumber(boxTotal)}
            </div>

        </div>


        <button
            class="product-button"
            onclick="saveCurrentInventory()"
        >
            수량 저장
        </button>

    `;


    const input =
        document.getElementById(
            "eachQty"
        );


    input.focus();


    input.addEventListener(
        "input",
        updateFinalTotal
    );


    input.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {

                e.preventDefault();

                saveCurrentInventory();

            }

        }
    );

}


/* =========================================================
   최종 수량 계산
========================================================= */

function updateFinalTotal() {

    const boxInput =
        document.getElementById(
            "boxQty"
        );


    const eachInput =
        document.getElementById(
            "eachQty"
        );


    const boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    const eachQty =
        eachInput
            ? cleanNumber(
                eachInput.value
            )
            : 0;


    const unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    const total =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    const output =
        document.getElementById(
            "finalTotalQty"
        );


    if (output) {

        output.innerText =
            formatNumber(total);

    }

}


/* =========================================================
   수량 저장
========================================================= */

function saveCurrentInventory() {

    if (!currentProduct) {

        alert(
            "제품 정보가 없습니다."
        );

        return;

    }


    const boxInput =
        document.getElementById(
            "boxQty"
        );


    const eachInput =
        document.getElementById(
            "eachQty"
        );


    const boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    const eachQty =
        eachInput
            ? cleanNumber(
                eachInput.value
            )
            : 0;


    const unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    const totalQty =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    /*
       새로운 재고조사 데이터 생성
    */

    const newItem = {

        "바코드":
            currentProduct.바코드,

        "랙":
            currentRack,

        "소비기한":
            currentExpiry,

        "수량":
            totalQty,

        "상품명":
            currentProduct.상품명,

        "화주사":
            currentProduct.화주사

    };


    /*
       배열에 등록
    */

    data.push(
        newItem
    );


    /*
       LocalStorage 저장
    */

    saveLocal();


    /*
       현재 작업 초기화
    */

    currentRack = "";

    currentProduct = null;

    currentExpiry = "";


    localStorage.removeItem(
        "currentExpiry"
    );


    /*
       저장 완료 메시지
    */

    alert(
        "수량이 저장되었습니다."
    );


    /*
       다시 랙 바코드부터 시작
    */

    render();

}


/* =========================================================
   엑셀 다운로드
========================================================= */

function download() {

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        alert(
            "아직 저장된 재고조사 데이터가 없습니다."
        );

        return;

    }


    fetch(
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

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response => {

            if (!response.ok) {

                throw new Error(
                    "서버 오류"
                );

            }

            return response.json();

        }
    )

    .then(
        result => {

            if (
                !result.file_id
            ) {

                alert(
                    result.error ||
                    "파일 생성 실패"
                );

                return;

            }


            window.location =
                "/download/" +
                result.file_id;

        }
    )

    .catch(
        error => {

            console.error(
                "다운로드 오류:",
                error
            );

            alert(
                "엑셀 다운로드 중 오류가 발생했습니다."
            );

        }
    );

}


/* =========================================================
   엑셀 공유
========================================================= */

function share() {

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        alert(
            "아직 저장된 재고조사 데이터가 없습니다."
        );

        return;

    }


    fetch(
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

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response => {

            if (!response.ok) {

                throw new Error(
                    "서버 오류"
                );

            }

            return response.json();

        }
    )

    .then(
        result => {

            if (
                !result.file_id
            ) {

                alert(
                    result.error ||
                    "공유 링크 생성 실패"
                );

                return;

            }


            const url =
                location.origin +
                "/share/" +
                result.file_id;


            /*
               PDA의 공유 기능
            */

            if (
                navigator.share
            ) {

                navigator.share({

                    title:
                        "재고조사 결과",

                    text:
                        "재고조사 엑셀 파일",

                    url:
                        url

                })
                .catch(
                    () => {}
                );


                return;

            }


            /*
               클립보드
            */

            if (
                navigator.clipboard
            ) {

                navigator.clipboard
                    .writeText(url)
                    .then(
                        function () {

                            alert(
                                "공유 링크가 복사되었습니다."
                            );

                        }
                    )
                    .catch(
                        function () {

                            showManualCopy(
                                url
                            );

                        }
                    );

            }
            else {

                showManualCopy(
                    url
                );

            }

        }
    )

    .catch(
        error => {

            console.error(
                "공유 오류:",
                error
            );

            alert(
                "공유 링크 생성 중 오류가 발생했습니다."
            );

        }
    );

}


/* =========================================================
   수동 링크 복사
========================================================= */

function showManualCopy(url) {

    const app =
        document.getElementById(
            "app"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "card";


    div.innerHTML = `

        <p>
            <b>
                엑셀 다운로드 링크
            </b>
        </p>


        <input
            value="${escapeHtml(url)}"
            readonly
            onclick="this.select()"
        >

    `;


    app.prepend(div);

}


/* =========================================================
   QR 생성
========================================================= */

function createQR() {

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        alert(
            "아직 저장된 재고조사 데이터가 없습니다."
        );

        return;

    }


    fetch(
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

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if (
                !result.file_id
            ) {

                alert(
                    result.error ||
                    "QR 생성 실패"
                );

                return;

            }


            const qrUrl =
                "/qr/" +
                result.file_id;


            const old =
                document.getElementById(
                    "qr-box"
                );


            if (old) {

                old.remove();

            }


            const div =
                document.createElement(
                    "div"
                );


            div.id =
                "qr-box";


            div.className =
                "card";


            div.innerHTML = `

                <h3
                    style="text-align:center;"
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
                    style="text-align:center;"
                >
                    QR 스캔 시 엑셀 다운로드
                </p>


                <button
                    onclick="closeQR()"
                    style="
                        background:#f44336;
                    "
                >
                    닫기
                </button>

            `;


            document
                .getElementById(
                    "app"
                )
                .appendChild(
                    div
                );

        }
    )

    .catch(
        error => {

            console.error(
                "QR 오류:",
                error
            );

            alert(
                "QR 생성 중 오류가 발생했습니다."
            );

        }
    );

}


/* =========================================================
   QR 닫기
========================================================= */

function closeQR() {

    const box =
        document.getElementById(
            "qr-box"
        );


    if (box) {

        box.remove();

    }

}


/* =========================================================
   신규 재고 UI
========================================================= */

function toggleNewItem() {

    const box =
        document.getElementById(
            "newItemBox"
        );


    if (!box) {
        return;
    }


    if (
        box.style.display === "none" ||
        box.style.display === ""
    ) {

        box.style.display =
            "block";

    }
    else {

        box.style.display =
            "none";

    }

}


/* =========================================================
   신규 재고 등록
========================================================= */

function addNewItem() {

    const rack =
        cleanString(
            document.getElementById(
                "new_rack"
            )?.value
        );


    const barcode =
        cleanString(
            document.getElementById(
                "new_barcode"
            )?.value
        );


    const expiry =
        cleanString(
            document.getElementById(
                "new_exp"
            )?.value
        );


    const boxQty =
        cleanNumber(
            document.getElementById(
                "new_box"
            )?.value
        );


    const eachQty =
        cleanNumber(
            document.getElementById(
                "new_each"
            )?.value
        );


    if (!rack) {

        alert(
            "랙 바코드를 입력해주세요."
        );

        return;

    }


    if (!barcode) {

        alert(
            "제품 바코드를 입력해주세요."
        );

        return;

    }


    /*
       시트2에서 제품 검색
    */

    const found =
        findProduct(
            barcode
        );


    let productName = "";

    let owner = "";

    let unitQty = 0;


    if (found) {

        productName =
            cleanString(
                found.상품명
            );

        owner =
            cleanString(
                found.화주사
            );

        unitQty =
            cleanNumber(
                found.입수량
            );

    }


    const totalQty =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    data.push({

        "바코드":
            barcode,

        "랙":
            rack,

        "소비기한":
            expiry,

        "수량":
            totalQty,

        "상품명":
            productName,

        "화주사":
            owner,

        "신규":
            true

    });


    saveLocal();


    alert(
        "신규 재고가 등록되었습니다."
    );


    /*
       입력 초기화
    */

    const ids = [

        "new_rack",
        "new_barcode",
        "new_exp",
        "new_box",
        "new_each"

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value = "";

            }

        }
    );


    const box =
        document.getElementById(
            "newItemBox"
        );


    if (box) {

        box.style.display =
            "none";

    }


    render();

}


/* =========================================================
   페이지 로딩 후
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
           서버에서 전달받은 mapping이 없으면
           localStorage의 기존 매핑 사용
        */

        const savedMapping =
            localStorage.getItem(
                "mappingData"
            );


        if (
            savedMapping &&
            mappingData.length === 0
        ) {

            try {

                mappingData =
                    JSON.parse(
                        savedMapping
                    );

            }
            catch (error) {

                console.error(
                    "mapping 복원 실패:",
                    error
                );

            }

        }


        /*
           기존 조사 데이터 복원
        */

        const savedData =
            localStorage.getItem(
                "inventoryData"
            );


        if (
            savedData &&
            data.length === 0
        ) {

            try {

                const parsed =
                    JSON.parse(
                        savedData
                    );


                if (
                    Array.isArray(parsed) &&
                    parsed.length > 0
                ) {

                    data = parsed;

                }

            }
            catch (error) {

                console.error(
                    "재고 데이터 복원 실패:",
                    error
                );

            }

        }


        /*
           데이터가 있으면
           업로드 폼 숨김
        */

        if (
            data.length > 0
        ) {

            const uploadForm =
                document.getElementById(
                    "uploadForm"
                );


            if (uploadForm) {

                uploadForm.style.display =
                    "none";

            }


            const newItemBtn =
                document.getElementById(
                    "newItemBtn"
                );


            if (newItemBtn) {

                newItemBtn.style.display =
                    "block";

            }

        }

    }
);
