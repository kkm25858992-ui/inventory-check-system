"use strict";


/* =========================================================
   초기 데이터
========================================================= */

let inventory = Array.isArray(window.INITIAL_DATA)
    ? window.INITIAL_DATA
    : [];


let lookup = Array.isArray(window.INITIAL_LOOKUP)
    ? window.INITIAL_LOOKUP
    : [];


let currentRack = "";

let currentProduct = null;

let savedInventory = [];


/* =========================================================
   숫자
========================================================= */

function cleanNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }


    const text =
        String(value)
        .replace(/,/g, "")
        .trim();


    const number =
        parseFloat(text);


    if (isNaN(number)) {

        return 0;

    }


    return number;
}


/* =========================================================
   HTML 특수문자
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   localStorage
========================================================= */

function saveLocal() {

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(inventory)
    );


    localStorage.setItem(
        "lookupData",
        JSON.stringify(lookup)
    );


    localStorage.setItem(
        "currentRack",
        currentRack
    );

}


/* =========================================================
   초기화
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initialize();

    }
);


/* =========================================================
   초기화
========================================================= */

function initialize() {

    const saved =
        localStorage.getItem(
            "inventoryData"
        );


    const savedLookup =
        localStorage.getItem(
            "lookupData"
        );


    if (
        saved &&
        savedLookup
    ) {

        try {

            const oldInventory =
                JSON.parse(saved);


            const oldLookup =
                JSON.parse(savedLookup);


            if (
                Array.isArray(oldInventory) &&
                oldInventory.length > 0
            ) {

                const answer =
                    confirm(
                        "이전에 작업한 재고조사 데이터가 있습니다.\n\n이어하시겠습니까?"
                    );


                if (answer) {

                    inventory =
                        oldInventory;

                    lookup =
                        oldLookup;

                    currentRack =
                        localStorage.getItem(
                            "currentRack"
                        ) || "";


                    startInventory();

                    return;

                }

            }

        } catch (error) {

            console.error(
                error
            );

        }

    }


    if (
        lookup.length > 0
    ) {

        startInventory();

    }

}


/* =========================================================
   조사 시작
========================================================= */

function startInventory() {

    document
        .getElementById("uploadBox")
        ?.classList
        .add("hidden");


    renderScanUI();

}


/* =========================================================
   스캔 UI
========================================================= */

function renderScanUI() {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    const count =
        inventory.length;


    app.innerHTML = `

        <div class="card">

            <p>
                <b>현재 등록 건수:</b>
                ${count}
            </p>


            <div class="scan-label">
                1. 랙 바코드
            </div>


            <input
                id="rackBarcode"
                type="text"
                placeholder="랙 바코드를 스캔하세요"
                autocomplete="off"
                inputmode="none"
            >


            <button
                class="green-button"
                onclick="startProductScan()"
            >
                랙 확인
            </button>


            ${
                currentRack
                ?
                `
                <div class="status">
                    현재 랙:
                    <b>
                        ${escapeHtml(currentRack)}
                    </b>
                </div>
                `
                :
                ""
            }

        </div>


        ${
            count > 0
            ?
            `
            <div class="card">

                <button
                    class="green-button"
                    onclick="showResultPreview()"
                >
                    현재까지 등록된 재고 확인
                </button>


                <button
                    class="green-button"
                    onclick="download()"
                >
                    엑셀 다운로드
                </button>


                <button
                    class="green-button"
                    onclick="share()"
                >
                    엑셀 공유
                </button>


                <button
                    class="green-button"
                    onclick="createQR()"
                >
                    QR코드 생성
                </button>

            </div>
            `
            :
            ""
        }

    `;


    const rack =
        document.getElementById(
            "rackBarcode"
        );


    if (rack) {

        rack.focus();


        rack.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    startProductScan();

                }

            }
        );

    }

}


/* =========================================================
   랙 확인
========================================================= */

function startProductScan() {

    const input =
        document.getElementById(
            "rackBarcode"
        );


    if (!input) {
        return;
    }


    const rack =
        input.value.trim();


    if (!rack) {

        alert(
            "랙 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    currentRack =
        rack;


    saveLocal();


    renderProductUI();

}


/* =========================================================
   제품 스캔 UI
========================================================= */

function renderProductUI() {

    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">

            <div class="status">

                현재 랙:

                <b>
                    ${escapeHtml(currentRack)}
                </b>

            </div>


            <div class="scan-label">
                2. 제품 바코드
            </div>


            <input
                id="productBarcode"
                type="text"
                placeholder="제품 바코드를 스캔하세요"
                autocomplete="off"
                inputmode="none"
            >


            <button
                class="green-button"
                onclick="confirmProduct()"
            >
                제품 확인
            </button>


            <button
                class="gray-button"
                onclick="renderScanUI()"
            >
                랙 다시 스캔
            </button>

        </div>

    `;


    const input =
        document.getElementById(
            "productBarcode"
        );


    input.focus();


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                confirmProduct();

            }

        }
    );

}


/* =========================================================
   제품 바코드 매칭
========================================================= */

function findProduct(barcode) {

    const code =
        String(barcode)
        .trim();


    return lookup.find(
        function (item) {

            return (
                String(
                    item["바코드"] ?? ""
                ).trim()
                === code
            );

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


    const barcode =
        input.value.trim();


    if (!barcode) {

        alert(
            "제품 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    const product =
        findProduct(
            barcode
        );


    if (!product) {

        alert(
            "등록되지 않은 제품 바코드입니다.\n\n"
            + barcode
            + "\n\n시트2의 바코드를 확인해주세요."
        );


        input.select();

        input.focus();

        return;

    }


    currentProduct = {

        "바코드":
            String(
                product["바코드"] ?? ""
            ).trim(),

        "화주사":
            String(
                product["화주사"] ?? ""
            ).trim(),

        "입수량":
            cleanNumber(
                product["입수량"]
            ),

        "상품명":
            String(
                product["상품명"] ?? ""
            ).trim()

    };


    renderQuantityUI();

}


/* =========================================================
   수량 UI
========================================================= */

function renderQuantityUI() {

    const app =
        document.getElementById(
            "app"
        );


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    app.innerHTML = `

        <div class="card">

            <div class="status">

                랙:
                <b>
                    ${escapeHtml(currentRack)}
                </b>

                <br>

                제품:
                <b>
                    ${escapeHtml(
                        currentProduct["바코드"]
                    )}
                </b>

            </div>


            <div class="info-box">

                <div class="info-row">

                    <b>상품명:</b>

                    ${escapeHtml(
                        currentProduct["상품명"]
                    )}

                </div>


                <div class="info-row">

                    <b>화주사:</b>

                    ${escapeHtml(
                        currentProduct["화주사"]
                    )}

                </div>


                <div class="info-row">

                    <b>입수량:</b>

                    ${unitQty}

                </div>

            </div>


            <div class="scan-label">
                3. 소비기한
            </div>


            <input
                id="expiry"
                type="text"
                placeholder="YYYY-MM-DD"
                maxlength="10"
                inputmode="numeric"
                autocomplete="off"
            >


            <div class="qty-title">
                4. 박스수
            </div>


            <input
                id="boxQty"
                type="text"
                placeholder="박스수"
                inputmode="numeric"
                autocomplete="off"
            >


            <div class="qty-title">
                5. 낱개수량
            </div>


            <input
                id="eachQty"
                type="text"
                placeholder="낱개수량"
                inputmode="numeric"
                autocomplete="off"
            >


            <div class="big-number">

                총 수량

                <br>

                <span id="totalQty">
                    0
                </span>

            </div>


            <button
                id="saveProductButton"
                class="green-button"
                onclick="saveProduct()"
            >
                제품확인 및 저장
            </button>


            <button
                class="gray-button"
                onclick="renderProductUI()"
            >
                제품 다시 스캔
            </button>

        </div>

    `;


    setupExpiryInput();


    const expiry =
        document.getElementById(
            "expiry"
        );


    expiry.focus();


    const box =
        document.getElementById(
            "boxQty"
        );


    const each =
        document.getElementById(
            "eachQty"
        );


    box.addEventListener(
        "input",
        calculateTotal
    );


    each.addEventListener(
        "input",
        calculateTotal
    );


    box.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                each.focus();

            }

        }
    );


    each.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                saveProduct();

            }

        }
    );

}


/* =========================================================
   소비기한 입력
 *
 * 2026
 *   ↓
 * 2026-
 *   ↓
 * 2026-08
 *   ↓
 * 2026-08-17
 *
 * 년 4자리 입력 → 월
 * 월 2자리 입력 → 일
 * 날짜 완료 → 박스수
========================================================= */

function setupExpiryInput() {

    const input =
        document.getElementById(
            "expiry"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            let value =
                this.value
                .replace(/\D/g, "");


            if (
                value.length > 8
            ) {

                value =
                    value.substring(
                        0,
                        8
                    );

            }


            if (
                value.length >= 5
            ) {

                value =
                    value.substring(0, 4)
                    + "-"
                    + value.substring(4);

            }


            if (
                value.length >= 8
            ) {

                value =
                    value.substring(0, 7)
                    + "-"
                    + value.substring(7);

            }


            this.value =
                value;


            if (
                value.length === 10
            ) {

                const box =
                    document.getElementById(
                        "boxQty"
                    );


                if (box) {

                    setTimeout(
                        function () {

                            box.focus();

                            box.select();

                        },
                        50
                    );

                }

            }

        }
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();


                if (
                    this.value.length === 10
                ) {

                    const box =
                        document.getElementById(
                            "boxQty"
                        );


                    if (box) {

                        box.focus();

                    }

                }

            }

        }
    );

}


/* =========================================================
   총 수량 계산
========================================================= */

function calculateTotal() {

    if (!currentProduct) {
        return;
    }


    const box =
        cleanNumber(
            document.getElementById(
                "boxQty"
            )?.value
        );


    const each =
        cleanNumber(
            document.getElementById(
                "eachQty"
            )?.value
        );


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    const total =
        (
            unitQty * box
        ) + each;


    const output =
        document.getElementById(
            "totalQty"
        );


    if (output) {

        output.innerText =
            total;

    }

}


/* =========================================================
   제품 저장
========================================================= */

function saveProduct() {

    if (!currentRack) {

        alert(
            "랙 바코드가 없습니다."
        );

        renderScanUI();

        return;

    }


    if (!currentProduct) {

        alert(
            "제품 바코드가 없습니다."
        );

        renderProductUI();

        return;

    }


    const expiry =
        document.getElementById(
            "expiry"
        )?.value.trim();


    const box =
        cleanNumber(
            document.getElementById(
                "boxQty"
            )?.value
        );


    const each =
        cleanNumber(
            document.getElementById(
                "eachQty"
            )?.value
        );


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    if (!expiry) {

        alert(
            "소비기한을 입력해주세요."
        );

        document
            .getElementById(
                "expiry"
            )
            ?.focus();

        return;

    }


    if (
        expiry.length !== 10
    ) {

        alert(
            "소비기한을 YYYY-MM-DD 형식으로 입력해주세요."
        );

        document
            .getElementById(
                "expiry"
            )
            ?.focus();

        return;

    }


    const total =
        (
            unitQty * box
        ) + each;


    const row = {

        "바코드":
            currentProduct["바코드"],

        "랙":
            currentRack,

        "소비기한":
            expiry,

        "수량":
            total,

        "상품명":
            currentProduct["상품명"],

        "화주사":
            currentProduct["화주사"]

    };


    inventory.push(
        row
    );


    saveLocal();


    alert(
        "재고가 저장되었습니다.\n\n"
        + "상품명: "
        + currentProduct["상품명"]
        + "\n수량: "
        + total
    );


    // 다음 제품을 위해 초기화
    currentProduct = null;


    // 가장 중요한 부분
    // 저장 후 다시 랙 바코드부터 시작
    renderScanUI();

}


/* =========================================================
   현재 데이터 확인
========================================================= */

function showResultPreview() {

    const app =
        document.getElementById(
            "app"
        );


    if (
        inventory.length === 0
    ) {

        alert(
            "등록된 데이터가 없습니다."
        );

        return;

    }


    let html = `

        <div class="card">

            <h3>
                현재까지 등록된 재고
            </h3>

    `;


    inventory.forEach(
        function (item, index) {

            html += `

                <div class="result-card">

                    <b>
                        ${index + 1}.
                        ${escapeHtml(
                            item["상품명"]
                        )}
                    </b>

                    <br>

                    바코드:
                    ${escapeHtml(
                        item["바코드"]
                    )}

                    <br>

                    랙:
                    ${escapeHtml(
                        item["랙"]
                    )}

                    <br>

                    소비기한:
                    ${escapeHtml(
                        item["소비기한"]
                    )}

                    <br>

                    수량:
                    <b>
                        ${item["수량"]}
                    </b>

                    <br>

                    화주사:
                    ${escapeHtml(
                        item["화주사"]
                    )}

                </div>

            `;

        }
    );


    html += `

            <button
                class="green-button"
                onclick="renderScanUI()"
            >
                조사 계속하기
            </button>

        </div>

    `;


    app.innerHTML =
        html;

}


/* =========================================================
   서버 저장
========================================================= */

async function saveToServer() {

    if (
        inventory.length === 0
    ) {

        throw new Error(
            "저장할 재고조사 데이터가 없습니다."
        );

    }


    const response =
        await fetch(
            "/save",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    inventory:
                        inventory,

                    lookup:
                        lookup

                })

            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            result.error
            || "저장 실패"
        );

    }


    return result;

}


/* =========================================================
   다운로드
========================================================= */

async function download() {

    try {

        if (
            inventory.length === 0
        ) {

            alert(
                "등록된 재고가 없습니다."
            );

            return;

        }


        const result =
            await saveToServer();


        window.location =
            "/download/"
            + result.file_id;


    } catch (error) {

        console.error(
            error
        );


        alert(
            "엑셀 다운로드 실패\n\n"
            + error.message
        );

    }

}


/* =========================================================
   공유
========================================================= */

async function share() {

    try {

        if (
            inventory.length === 0
        ) {

            alert(
                "등록된 재고가 없습니다."
            );

            return;

        }


        const result =
            await saveToServer();


        const url =
            location.origin
            + "/share/"
            + result.file_id;


        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "재고조사 결과",

                text:
                    "재고조사 엑셀 다운로드",

                url:
                    url

            });

            return;

        }


        if (
            navigator.clipboard
        ) {

            await navigator.clipboard
                .writeText(url);


            alert(
                "공유 링크가 복사되었습니다."
            );


            return;

        }


        showManualCopy(
            url
        );


    } catch (error) {

        console.error(
            error
        );


        if (
            error.name
            === "AbortError"
        ) {

            return;

        }


        alert(
            "공유 실패\n\n"
            + error.message
        );

    }

}


/* =========================================================
   수동 링크 복사
========================================================= */

function showManualCopy(url) {

    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML += `

        <div class="card">

            <b>
                공유 링크
            </b>


            <input
                value="${escapeHtml(url)}"
                readonly
                onclick="this.select()"
            >


            <button
                class="green-button"
                onclick="copyManualLink()"
            >
                링크 복사
            </button>

        </div>

    `;


    window.manualShareUrl =
        url;

}


/* =========================================================
   링크 복사
========================================================= */

function copyManualLink() {

    if (
        !window.manualShareUrl
    ) {
        return;
    }


    navigator.clipboard
        ?.writeText(
            window.manualShareUrl
        )
        .then(
            function () {

                alert(
                    "링크가 복사되었습니다."
                );

            }
        );

}


/* =========================================================
   QR 생성
========================================================= */

async function createQR() {

    try {

        if (
            inventory.length === 0
        ) {

            alert(
                "등록된 재고가 없습니다."
            );

            return;

        }


        const result =
            await saveToServer();


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
                style="
                    text-align:center;
                "
            >
                QR코드
            </h3>


            <img
                src="/qr/${result.file_id}"
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
                QR 스캔 시 엑셀 다운로드
            </p>


            <button
                class="red-button"
                onclick="closeQR()"
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


    } catch (error) {

        console.error(
            error
        );


        alert(
            "QR 생성 실패\n\n"
            + error.message
        );

    }

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
   페이지 이탈 방지
========================================================= */

window.addEventListener(
    "beforeunload",
    function (event) {

        if (
            inventory.length > 0
        ) {

            event.preventDefault();

            event.returnValue = "";

        }

    }
);
