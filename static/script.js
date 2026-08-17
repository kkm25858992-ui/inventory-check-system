/* =========================================================
   전역 변수
========================================================= */

let inventoryData = [];

let currentRack = "";

let currentProduct = null;

let mappingData = [];

let inventoryCount = 0;


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
   페이지 시작
========================================================= */

window.onload = function(){

    mappingData = Array.isArray(mapping)
        ? mapping
        : [];


    // 이전 조사 데이터 불러오기
    const saved =
        localStorage.getItem(
            "inventoryData"
        );


    if(saved){

        try{

            const oldData =
                JSON.parse(saved);


            if(
                Array.isArray(oldData)
                &&
                oldData.length > 0
            ){

                const result =
                    confirm(
                        "이전에 조사한 데이터가 있습니다.\n\n" +
                        "이어서 조사하시겠습니까?"
                    );


                if(result){

                    inventoryData =
                        oldData;

                    currentRack =
                        localStorage.getItem(
                            "currentRack"
                        ) || "";


                }else{

                    localStorage.removeItem(
                        "inventoryData"
                    );

                    localStorage.removeItem(
                        "currentRack"
                    );

                    inventoryData = [];

                    currentRack = "";
                }
            }

        }catch(e){

            console.error(e);

            localStorage.removeItem(
                "inventoryData"
            );
        }
    }


    // 상품 마스터가 있으면 조사 화면
    if(mappingData.length > 0){

        document
            .getElementById("uploadBox")
            .classList.add("hidden");

        showRackScreen();

        return;
    }


    // 마스터가 없고 기존 데이터가 있으면
    // 조사 화면
    if(inventoryData.length > 0){

        document
            .getElementById("uploadBox")
            .classList.add("hidden");

        showRackScreen();

    }

};


/* =========================================================
   데이터 저장
========================================================= */

function saveLocalData(){

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(
            inventoryData
        )
    );


    localStorage.setItem(
        "currentRack",
        currentRack
    );
}


/* =========================================================
   랙 스캔 화면
========================================================= */

function showRackScreen(){

    currentProduct = null;


    document
        .getElementById("app")
        .innerHTML = `

        <div class="card">

            <h2>
                랙 바코드 스캔
            </h2>

            <p>
                현재 재고조사할 랙의 바코드를 스캔하세요.
            </p>


            <div class="scan-box">

                <div class="scan-title">
                    랙 바코드
                </div>


                <input
                    id="rackBarcode"
                    type="text"
                    inputmode="none"
                    autocomplete="off"
                    placeholder="랙 바코드 스캔"
                    onkeydown="rackKeyDown(event)"
                >


                <button
                    class="rack-btn"
                    onclick="confirmRack()"
                >
                    랙 확인
                </button>

            </div>


            ${
                currentRack
                ?
                `
                <div class="status">

                    현재 랙:
                    <b>${escapeHtml(currentRack)}</b>

                </div>
                `
                :
                ""
            }


            <div class="result-list">

                <p>
                    <b>
                        현재까지 조사:
                        ${inventoryData.length}건
                    </b>
                </p>

            </div>


            <button
                class="download-btn"
                onclick="download()"
            >
                엑셀 다운로드
            </button>


            <button
                class="share-btn"
                onclick="share()"
            >
                엑셀 공유
            </button>


            <button
                class="qr-btn"
                onclick="createQR()"
            >
                QR코드 생성
            </button>

        </div>
        `;


    focusInput(
        "rackBarcode"
    );
}


/* =========================================================
   랙 바코드 Enter
========================================================= */

function rackKeyDown(event){

    if(event.key === "Enter"){

        event.preventDefault();

        confirmRack();
    }
}


/* =========================================================
   랙 확인
========================================================= */

function confirmRack(){

    const input =
        document.getElementById(
            "rackBarcode"
        );


    if(!input){

        return;
    }


    const rack =
        input.value.trim();


    if(!rack){

        alert(
            "랙 바코드를 스캔해주세요."
        );

        focusInput(
            "rackBarcode"
        );

        return;
    }


    currentRack = rack;


    saveLocalData();


    showProductScreen();
}


/* =========================================================
   제품 바코드 화면
========================================================= */

function showProductScreen(){

    currentProduct = null;


    const progress =
        inventoryData.length;


    document
        .getElementById("app")
        .innerHTML = `

        <div class="card">

            <p>
                <b>현재 랙:</b>
                ${escapeHtml(currentRack)}
            </p>


            <div class="scan-box">

                <div class="scan-title">
                    제품 바코드 스캔
                </div>


                <input
                    id="productBarcode"
                    type="text"
                    inputmode="none"
                    autocomplete="off"
                    placeholder="제품 바코드 스캔"
                    onkeydown="productKeyDown(event)"
                >


                <button
                    class="product-check-btn"
                    onclick="confirmProduct()"
                >
                    제품확인
                </button>

            </div>


            <div class="status">

                현재까지 조사:
                <b>${progress}</b>건

            </div>


            <button
                class="download-btn"
                onclick="download()"
            >
                엑셀 다운로드
            </button>


            <button
                class="share-btn"
                onclick="share()"
            >
                엑셀 공유
            </button>


            <button
                class="qr-btn"
                onclick="createQR()"
            >
                QR코드 생성
            </button>


            <button
                onclick="changeRack()"
            >
                랙 변경
            </button>

        </div>
        `;


    focusInput(
        "productBarcode"
    );
}


/* =========================================================
   제품 바코드 Enter
========================================================= */

function productKeyDown(event){

    if(event.key === "Enter"){

        event.preventDefault();

        confirmProduct();
    }
}


/* =========================================================
   제품 바코드 확인
========================================================= */

function confirmProduct(){

    const input =
        document.getElementById(
            "productBarcode"
        );


    if(!input){

        return;
    }


    const barcode =
        input.value.trim();


    if(!barcode){

        alert(
            "제품 바코드를 스캔해주세요."
        );

        focusInput(
            "productBarcode"
        );

        return;
    }


    // =====================================================
    // 상품 마스터에서 바코드 검색
    // =====================================================

    const product =
        mappingData.find(
            item => {

                return String(
                    item["바코드"] ?? ""
                ).trim()
                === barcode;

            }
        );


    if(!product){

        alert(
            "등록되지 않은 제품입니다.\n\n" +
            "바코드: " +
            barcode
        );


        input.select();

        return;
    }


    currentProduct = {

        "바코드": barcode,

        "화주사":
            product["화주사"] || "",

        "입수량":
            cleanNumber(
                product["입수량"]
            ),

        "상품명":
            product["상품명"] || ""

    };


    showQuantityScreen();
}


/* =========================================================
   수량 입력 화면
========================================================= */

function showQuantityScreen(){

    const product =
        currentProduct;


    document
        .getElementById("app")
        .innerHTML = `

        <div class="card">


            <!-- 진행 정보 -->

            <p>

                <b>현재 랙:</b>
                ${escapeHtml(currentRack)}

            </p>


            <!-- 상품 정보 -->

            <div class="info-row">

                <span class="info-label">
                    바코드:
                </span>

                ${escapeHtml(product["바코드"])}

            </div>


            <div class="info-row">

                <span class="info-label">
                    화주사:
                </span>

                ${escapeHtml(product["화주사"])}

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명:
                </span>

                ${escapeHtml(product["상품명"])}

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량:
                </span>

                ${product["입수량"]}

            </div>


            <!-- 소비기한 -->

            <div class="qty-title">
                소비기한
            </div>


            <input
                id="expiry"
                type="text"
                placeholder="예: 2026-12-31"
                autocomplete="off"
            >


            <!-- 박스 수 -->

            <div class="qty-title">
                박스 수량
            </div>


            <input
                id="boxQty"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="박스 수량"
                oninput="calculateTotal()"
                onkeydown="quantityKeyDown(event)"
            >


            <!-- 낱개 수 -->

            <div class="qty-title">
                낱개 수량
            </div>


            <input
                id="eachQty"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="낱개 수량"
                oninput="calculateTotal()"
                onkeydown="quantityKeyDown(event)"
            >


            <!-- 총 수량 -->

            <div class="qty-result">

                총 수량:
                <span id="totalQty">
                    0
                </span>

            </div>


            <button
                class="save-qty-btn"
                onclick="saveQuantity()"
            >
                수량 저장
            </button>


            <button
                onclick="cancelProduct()"
            >
                제품 취소
            </button>


        </div>
        `;


    focusInput(
        "boxQty"
    );
}


/* =========================================================
   수량 계산
========================================================= */

function calculateTotal(){

    if(!currentProduct){

        return;
    }


    const boxQty =
        cleanNumber(
            document.getElementById(
                "boxQty"
            )?.value
        );


    const eachQty =
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
        (unitQty * boxQty)
        + eachQty;


    const totalElement =
        document.getElementById(
            "totalQty"
        );


    if(totalElement){

        totalElement.innerText =
            total;
    }
}


/* =========================================================
   수량 입력 Enter
========================================================= */

function quantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const target =
        event.target;


    if(target.id === "boxQty"){

        focusInput(
            "eachQty"
        );

        return;
    }


    if(target.id === "eachQty"){

        saveQuantity();

    }

}


/* =========================================================
   수량 저장
========================================================= */

function saveQuantity(){

    if(!currentProduct){

        return;
    }


    const boxQty =
        cleanNumber(
            document.getElementById(
                "boxQty"
            )?.value
        );


    const eachQty =
        cleanNumber(
            document.getElementById(
                "eachQty"
            )?.value
        );


    const totalQty =
        (
            cleanNumber(
                currentProduct["입수량"]
            )
            *
            boxQty
        )
        +
        eachQty;


    const expiry =
        document.getElementById(
            "expiry"
        )?.value.trim() || "";


    // =====================================================
    // 실제 조사 데이터 등록
    // =====================================================

    inventoryData.push({

        "바코드":
            currentProduct["바코드"],

        "랙":
            currentRack,

        "소비기한":
            expiry,

        "수량":
            totalQty,

        "품명":
            currentProduct["상품명"],

        "화주사":
            currentProduct["화주사"]

    });


    inventoryCount =
        inventoryData.length;


    saveLocalData();


    // =====================================================
    // 다음 제품
    // =====================================================

    showProductScreen();
}


/* =========================================================
   제품 취소
========================================================= */

function cancelProduct(){

    currentProduct = null;

    showProductScreen();
}


/* =========================================================
   랙 변경
========================================================= */

function changeRack(){

    currentRack = "";

    saveLocalData();

    showRackScreen();
}


/* =========================================================
   다운로드
========================================================= */

function download(){

    if(inventoryData.length === 0){

        alert(
            "재고조사 데이터가 없습니다."
        );

        return;
    }


    saveToServer()
        .then(
            fileId => {

                window.location =
                    "/download/"
                    + fileId;

            }
        )
        .catch(
            error => {

                console.error(error);

                alert(
                    "엑셀 저장에 실패했습니다."
                );

            }
        );
}


/* =========================================================
   공유
========================================================= */

function share(){

    if(inventoryData.length === 0){

        alert(
            "재고조사 데이터가 없습니다."
        );

        return;
    }


    saveToServer()
        .then(
            fileId => {

                const url =
                    location.origin
                    + "/share/"
                    + fileId;


                if(navigator.share){

                    navigator.share({

                        title:
                            "재고조사 결과",

                        text:
                            "재고조사 파일 다운로드",

                        url:
                            url

                    })
                    .catch(
                        () => {}
                    );


                    return;
                }


                if(navigator.clipboard){

                    navigator.clipboard
                        .writeText(url)
                        .then(
                            () => {

                                alert(
                                    "공유 링크가 복사되었습니다."
                                );

                            }
                        )
                        .catch(
                            () => {

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
        )
        .catch(
            error => {

                console.error(error);

                alert(
                    "공유 링크 생성에 실패했습니다."
                );

            }
        );
}


/* =========================================================
   서버 저장
========================================================= */

function saveToServer(){

    return fetch(
        "/save",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                inventory:
                    inventoryData,

                mapping:
                    mappingData

            })

        }
    )
    .then(
        response => {

            if(!response.ok){

                throw new Error(
                    "서버 저장 실패"
                );

            }


            return response.json();

        }
    )
    .then(
        result => {

            if(result.error){

                throw new Error(
                    result.error
                );

            }


            return result.file_id;

        }
    );
}


/* =========================================================
   수동 링크 복사
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById(
            "app"
        );


    const old =
        document.getElementById(
            "manual-copy"
        );


    if(old){

        old.remove();
    }


    const div =
        document.createElement(
            "div"
        );


    div.id =
        "manual-copy";


    div.className =
        "card";


    div.innerHTML = `

        <p>
            <b>
                공유 링크
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

    `;


    app.prepend(div);
}


/* =========================================================
   QR 코드 생성
========================================================= */

function createQR(){

    if(inventoryData.length === 0){

        alert(
            "재고조사 데이터가 없습니다."
        );

        return;
    }


    saveToServer()
        .then(
            fileId => {

                const qrUrl =
                    "/qr/"
                    + fileId;


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
                            style="text-align:center;"
                        >
                            QR코드
                        </h3>


                        <img
                            src="${qrUrl}"
                        >


                        <p
                            style="text-align:center;"
                        >
                            QR 스캔 시
                            엑셀 다운로드
                        </p>


                        <button
                            onclick="closeQR()"
                            style="
                                background:#f44336;
                            "
                        >
                            닫기
                        </button>

                    </div>

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

                console.error(error);

                alert(
                    "QR 생성 실패"
                );

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
   입력창 포커스
========================================================= */

function focusInput(id){

    setTimeout(
        () => {

            const input =
                document.getElementById(
                    id
                );


            if(input){

                input.focus();

                input.select();

            }

        },
        100
    );
}


/* =========================================================
   HTML 안전 처리
========================================================= */

function escapeHtml(value){

    return String(
        value ?? ""
    )
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
