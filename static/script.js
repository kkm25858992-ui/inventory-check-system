/* =========================================================
   전역 변수
========================================================= */

let inventoryData = [];

let currentRack = "";

let currentProduct = null;

let mappingData = [];

let inventoryCount = 0;


/* =========================================================
   숫자
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
   시작
========================================================= */

window.onload = function(){

    mappingData = Array.isArray(mapping)
        ? mapping
        : [];


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


    document
        .getElementById("uploadBox")
        .classList.add("hidden");


    /*
     * 상품마스터가 있으면 바로 랙 스캔
     */

    if(mappingData.length > 0){

        showRackScreen();

        return;
    }


    /*
     * 기존 조사 데이터가 있어도
     * 랙 스캔 화면으로 시작
     */

    if(inventoryData.length > 0){

        showRackScreen();

        return;
    }


    /*
     * 상품마스터가 없는 경우
     * 업로드 화면 표시
     */

    document
        .getElementById("uploadBox")
        .classList.remove("hidden");

};


/* =========================================================
   로컬 저장
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
   랙 바코드 화면
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
                조사할 랙의 바코드를 스캔하세요.
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


            <div class="status">

                현재까지 조사:
                <b>
                    ${inventoryData.length}
                </b>
                건

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


    /*
     * 화면이 만들어진 후
     * 랙 바코드 입력칸에 자동 포커스
     */

    focusInput(
        "rackBarcode"
    );
}


/* =========================================================
   랙 Enter
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


    const rack =
        input?.value.trim();


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


    /*
     * 랙 입력 후
     * 제품 바코드 화면으로 이동
     */

    showProductScreen();
}


/* =========================================================
   제품 바코드 화면
========================================================= */

function showProductScreen(){

    currentProduct = null;


    document
        .getElementById("app")
        .innerHTML = `

        <div class="card">

            <div class="info-row">

                <span class="info-label">
                    현재 랙:
                </span>

                ${escapeHtml(currentRack)}

            </div>


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
                <b>
                    ${inventoryData.length}
                </b>
                건

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


    /*
     * 제품 바코드 자동 포커스
     */

    focusInput(
        "productBarcode"
    );
}


/* =========================================================
   제품 Enter
========================================================= */

function productKeyDown(event){

    if(event.key === "Enter"){

        event.preventDefault();

        confirmProduct();
    }
}


/* =========================================================
   제품 확인
========================================================= */

function confirmProduct(){

    const input =
        document.getElementById(
            "productBarcode"
        );


    const barcode =
        input?.value.trim();


    if(!barcode){

        alert(
            "제품 바코드를 스캔해주세요."
        );


        focusInput(
            "productBarcode"
        );


        return;
    }


    /*
     * 상품마스터에서 바코드 검색
     */

    const product =
        mappingData.find(
            item => {

                return String(
                    item["바코드"] ?? ""
                )
                .trim()
                === barcode;

            }
        );


    /*
     * 등록되지 않은 바코드
     */

    if(!product){

        alert(
            "등록되지 않은 제품입니다.\n\n" +
            "바코드: " +
            barcode
        );


        input.select();


        return;
    }


    /*
     * 현재 제품 저장
     */

    currentProduct = {

        "바코드":
            barcode,

        "화주사":
            product["화주사"] || "",

        "입수량":
            cleanNumber(
                product["입수량"]
            ),

        "상품명":
            product["상품명"] || ""

    };


    /*
     * 제품 확인 후
     * 바로 소비기한 입력 화면
     */

    showQuantityScreen();
}


/* =========================================================
   소비기한 + 수량 화면
========================================================= */

function showQuantityScreen(){

    const product =
        currentProduct;


    document
        .getElementById("app")
        .innerHTML = `

        <div class="card">


            <!-- ================================
                 현재 랙
            ================================= -->

            <div class="info-row">

                <span class="info-label">
                    현재 랙:
                </span>

                ${escapeHtml(currentRack)}

            </div>


            <!-- ================================
                 바코드
            ================================= -->

            <div class="info-row">

                <span class="info-label">
                    바코드:
                </span>

                ${escapeHtml(product["바코드"])}

            </div>


            <!-- ================================
                 화주사
            ================================= -->

            <div class="info-row">

                <span class="info-label">
                    화주사:
                </span>

                ${escapeHtml(product["화주사"])}

            </div>


            <!-- ================================
                 상품명
            ================================= -->

            <div class="info-row">

                <span class="info-label">
                    상품명:
                </span>

                ${escapeHtml(product["상품명"])}

            </div>


            <!-- ================================
                 입수량
            ================================= -->

            <div class="info-row">

                <span class="info-label">
                    입수량:
                </span>

                ${product["입수량"]}

            </div>


            <!-- =================================================
                 소비기한
            ================================================= -->

            <div class="date-title">
                소비기한
            </div>


            <div class="date-inputs">


                <!-- 년 -->

                <input
                    id="expiryYear"
                    class="date-year"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="년"
                    autocomplete="off"
                    oninput="dateYearInput()"
                    onkeydown="dateKeyDown(event)"
                >


                <span class="date-separator">
                    -
                </span>


                <!-- 월 -->

                <input
                    id="expiryMonth"
                    class="date-month"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="월"
                    autocomplete="off"
                    oninput="dateMonthInput()"
                    onkeydown="dateKeyDown(event)"
                >


                <span class="date-separator">
                    -
                </span>


                <!-- 일 -->

                <input
                    id="expiryDay"
                    class="date-day"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="일"
                    autocomplete="off"
                    oninput="dateDayInput()"
                    onkeydown="dateKeyDown(event)"
                >

            </div>


            <!-- =================================================
                 수량
            ================================================= -->

            <div class="qty-title">
                수량
            </div>


            <input
                id="quantity"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="수량 입력"
                onkeydown="quantityKeyDown(event)"
            >


            <!-- =================================================
                 저장
            ================================================= -->

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


    /*
     * ★ 가장 중요
     *
     * 제품 바코드 확인 후
     * 소비기한 년도 칸으로 자동 포커스
     */

    focusInput(
        "expiryYear"
    );
}


/* =========================================================
   날짜 - 년도
========================================================= */

function dateYearInput(){

    const input =
        document.getElementById(
            "expiryYear"
        );


    /*
     * 숫자만 허용
     */

    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 4자리 입력 완료
     * → 월로 이동
     */

    if(
        input.value.length >= 4
    ){

        input.value =
            input.value.substring(
                0,
                4
            );


        focusInput(
            "expiryMonth"
        );
    }
}


/* =========================================================
   날짜 - 월
========================================================= */

function dateMonthInput(){

    const input =
        document.getElementById(
            "expiryMonth"
        );


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 2자리 입력 완료
     * → 일로 이동
     */

    if(
        input.value.length >= 2
    ){

        input.value =
            input.value.substring(
                0,
                2
            );


        focusInput(
            "expiryDay"
        );
    }
}


/* =========================================================
   날짜 - 일
========================================================= */

function dateDayInput(){

    const input =
        document.getElementById(
            "expiryDay"
        );


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 2자리 입력 완료
     *
     * ★ 여기서 바로 수량 입력칸으로 이동
     */

    if(
        input.value.length >= 2
    ){

        input.value =
            input.value.substring(
                0,
                2
            );


        focusInput(
            "quantity"
        );
    }
}


/* =========================================================
   날짜 Enter
========================================================= */

function dateKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const id =
        event.target.id;


    if(id === "expiryYear"){

        focusInput(
            "expiryMonth"
        );

    }
    else if(id === "expiryMonth"){

        focusInput(
            "expiryDay"
        );

    }
    else if(id === "expiryDay"){

        /*
         * 소비기한 Enter
         * → 수량
         */

        focusInput(
            "quantity"
        );

    }
}


/* =========================================================
   소비기한 가져오기
========================================================= */

function getExpiryDate(){

    const year =
        document.getElementById(
            "expiryYear"
        )?.value.trim() || "";


    const month =
        document.getElementById(
            "expiryMonth"
        )?.value.trim() || "";


    const day =
        document.getElementById(
            "expiryDay"
        )?.value.trim() || "";


    /*
     * 전부 비어있으면 빈 값
     */

    if(
        !year &&
        !month &&
        !day
    ){

        return "";
    }


    /*
     * 형식 체크
     */

    if(
        year.length !== 4
        ||
        month.length !== 2
        ||
        day.length !== 2
    ){

        alert(
            "소비기한을 년-월-일 형식으로 입력해주세요."
        );


        return null;
    }


    /*
     * 월 체크
     */

    const monthNumber =
        Number(month);


    if(
        monthNumber < 1
        ||
        monthNumber > 12
    ){

        alert(
            "월은 01~12 사이로 입력해주세요."
        );


        focusInput(
            "expiryMonth"
        );


        return null;
    }


    /*
     * 일 체크
     */

    const dayNumber =
        Number(day);


    if(
        dayNumber < 1
        ||
        dayNumber > 31
    ){

        alert(
            "일은 01~31 사이로 입력해주세요."
        );


        focusInput(
            "expiryDay"
        );


        return null;
    }


    return (
        year
        + "-"
        + month
        + "-"
        + day
    );
}


/* =========================================================
   수량 Enter
========================================================= */

function quantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    /*
     * Enter를 누르면
     * 바로 수량 저장
     */

    saveQuantity();
}


/* =========================================================
   수량 저장
========================================================= */

function saveQuantity(){

    if(!currentProduct){

        return;
    }


    /*
     * 소비기한 확인
     */

    const expiry =
        getExpiryDate();


    if(expiry === null){

        return;
    }


    /*
     * 수량
     */

    const quantityInput =
        document.getElementById(
            "quantity"
        );


    const quantity =
        cleanNumber(
            quantityInput?.value
        );


    /*
     * 수량이 0인 경우
     */

    if(
        quantity <= 0
    ){

        alert(
            "수량을 입력해주세요."
        );


        focusInput(
            "quantity"
        );


        return;
    }


    /*
     * =====================================================
     * 시트1에 저장할 데이터
     * =====================================================
     *
     * A = 바코드
     * B = 랙
     * C = 소비기한
     * D = 수량
     * E = 상품명
     * F = 화주사
     *
     */

    inventoryData.push({

        "바코드":
            currentProduct["바코드"],

        "랙":
            currentRack,

        "소비기한":
            expiry,

        "수량":
            quantity,

        "상품명":
            currentProduct["상품명"],

        "화주사":
            currentProduct["화주사"]

    });


    inventoryCount =
        inventoryData.length;


    /*
     * 로컬 저장
     */

    saveLocalData();


    /*
     * =====================================================
     * ★ 핵심 변경
     *
     * 수량 저장 후
     * 제품 화면으로 가지 않고
     *
     * 다시 랙 바코드 스캔부터 시작
     * =====================================================
     */

    currentRack = "";

    currentProduct = null;


    saveLocalData();


    showRackScreen();
}


/* =========================================================
   제품 취소
========================================================= */

function cancelProduct(){

    currentProduct = null;

    /*
     * 제품 취소도 다시
     * 제품 바코드 화면으로
     */

    showProductScreen();
}


/* =========================================================
   랙 변경
========================================================= */

function changeRack(){

    currentRack = "";

    currentProduct = null;


    saveLocalData();


    showRackScreen();
}


/* =========================================================
   다운로드
========================================================= */

function download(){

    if(
        inventoryData.length === 0
    ){

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

    if(
        inventoryData.length === 0
    ){

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

                    })
                    .catch(
                        () => {}
                    );


                    return;
                }


                if(
                    navigator.clipboard
                ){

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

                }
                else{

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
   수동 공유
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
   QR 생성
========================================================= */

function createQR(){

    if(
        inventoryData.length === 0
    ){

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
   포커스 함수
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
