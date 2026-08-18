/* =========================================================
   전역 변수
========================================================= */

let data = [];
let currentIndex = 0;
let currentRack = "";
let currentProduct = null;
let inventoryData = [];

let inventoryCount = 0;

let fileId = null;


/* =========================================================
   상품 마스터 데이터 정리
========================================================= */

function getMappingData(){

    /*
     * index.html에서
     *
     * let mapping = {{ mapping|tojson }};
     *
     * 으로 전달됨
     */

    if(
        typeof mapping === "undefined"
        ||
        mapping === null
    ){

        return [];
    }


    /*
     * 배열인 경우
     */

    if(Array.isArray(mapping)){

        return mapping;
    }


    /*
     * 객체 형태로 전달된 경우
     */

    if(typeof mapping === "object"){

        return Object.values(mapping);
    }


    return [];
}


/* =========================================================
   숫자 정리
========================================================= */

function cleanNumber(value){

    if(
        value === null
        ||
        value === undefined
    ){

        return 0;
    }


    const text =
        String(value)
            .replace(/,/g, "")
            .replace(/\s/g, "")
            .trim();


    if(text === ""){

        return 0;
    }


    const number =
        parseFloat(text);


    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   HTML 문자 처리
========================================================= */

function escapeHtml(value){

    if(
        value === null
        ||
        value === undefined
    ){

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
   입력창 포커스
========================================================= */

function focusInput(id){

    setTimeout(function(){

        const input =
            document.getElementById(id);


        if(input){

            input.focus();

            try{

                input.select();

            }catch(e){}

        }

    }, 100);
}


/* =========================================================
   localStorage 저장
========================================================= */

function saveLocalData(){

    try{

        localStorage.setItem(
            "inventoryData",
            JSON.stringify(inventoryData)
        );


        localStorage.setItem(
            "currentRack",
            currentRack || ""
        );


        localStorage.setItem(
            "currentIndex",
            String(currentIndex)
        );


    }catch(error){

        console.error(
            "localStorage 저장 오류:",
            error
        );
    }
}


/* =========================================================
   localStorage 불러오기
========================================================= */

function loadLocalData(){

    try{

        const savedInventory =
            localStorage.getItem(
                "inventoryData"
            );


        if(savedInventory){

            const parsed =
                JSON.parse(savedInventory);


            if(Array.isArray(parsed)){

                inventoryData = parsed;
            }
        }


        const savedRack =
            localStorage.getItem(
                "currentRack"
            );


        if(savedRack !== null){

            currentRack = savedRack;
        }


        const savedIndex =
            localStorage.getItem(
                "currentIndex"
            );


        if(savedIndex !== null){

            const parsedIndex =
                parseInt(
                    savedIndex,
                    10
                );


            if(Number.isFinite(parsedIndex)){

                currentIndex =
                    parsedIndex;
            }
        }


        inventoryCount =
            inventoryData.length;


    }catch(error){

        console.error(
            "localStorage 불러오기 오류:",
            error
        );
    }
}


/* =========================================================
   초기화
========================================================= */

function init(){

    data =
        getMappingData();


    loadLocalData();


    /*
     * 상품 마스터가 없으면
     * 업로드 안내 화면 유지
     */

    if(data.length === 0){

        showUploadMessage();

        return;
    }


    /*
     * 기존 조사 데이터가 있으면
     * 이어서 조사할 수 있도록 랙 화면
     */

    showRackScreen();
}


/* =========================================================
   업로드 안내
========================================================= */

function showUploadMessage(){

    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div
                class="status"
                style="text-align:center;"
            >

                상품마스터 엑셀을 업로드해주세요.

            </div>

        </div>

    `;
}


/* =========================================================
   랙 입력 화면
========================================================= */

function showRackScreen(){

    currentProduct = null;


    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div class="scan-box">

                <div class="scan-title">
                    랙 스캔
                </div>

                <input
                    id="rackInput"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    placeholder="랙을 스캔하거나 입력하세요"
                    onkeydown="rackKeyDown(event)"
                >

                <button
                    class="rack-btn"
                    onclick="confirmRack()"
                >
                    랙 확인
                </button>

            </div>


            <div
                class="status"
                style="text-align:center;"
            >

                조사 완료:
                <b>
                    ${inventoryData.length}
                </b>
                건

            </div>


            ${
                inventoryData.length > 0
                ?
                `
                <button
                    class="download-btn"
                    onclick="download()"
                >
                    조사 결과 저장
                </button>

                <button
                    class="share-btn"
                    onclick="share()"
                >
                    조사 결과 공유
                </button>

                <button
                    onclick="changeRack()"
                >
                    랙 다시 입력
                </button>
                `
                :
                ""
            }

        </div>

    `;


    focusInput("rackInput");
}


/* =========================================================
   랙 입력 Enter
========================================================= */

function rackKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    confirmRack();
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
        input.value.trim();


    if(!rack){

        alert(
            "랙을 입력하거나 스캔해주세요."
        );


        focusInput("rackInput");

        return;
    }


    currentRack =
        rack;


    saveLocalData();


    showProductScreen();
}


/* =========================================================
   상품 바코드 화면
========================================================= */

function showProductScreen(){

    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div class="info-row">

                <span class="info-label">
                    현재 랙:
                </span>

                ${escapeHtml(currentRack)}

            </div>


            <div class="scan-box">

                <div class="scan-title">
                    상품 바코드 스캔
                </div>


                <input
                    id="barcodeInput"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="상품 바코드를 스캔하세요"
                    onkeydown="barcodeKeyDown(event)"
                >


                <button
                    class="barcode-btn"
                    onclick="confirmProduct()"
                >
                    상품 확인
                </button>

            </div>


            <button
                onclick="changeRack()"
            >
                랙 변경
            </button>

        </div>

    `;


    focusInput("barcodeInput");
}


/* =========================================================
   바코드 Enter
========================================================= */

function barcodeKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    confirmProduct();
}


/* =========================================================
   바코드 확인
========================================================= */

function confirmProduct(){

    const input =
        document.getElementById(
            "barcodeInput"
        );


    if(!input){

        return;
    }


    const barcode =
        String(input.value || "")
            .trim();


    if(!barcode){

        alert(
            "상품 바코드를 스캔해주세요."
        );


        focusInput("barcodeInput");

        return;
    }


    const mappingData =
        getMappingData();


    /*
     * 바코드로 상품 검색
     */

    const product =
        mappingData.find(function(item){

            const itemBarcode =
                String(
                    item["바코드"] ?? ""
                ).trim();


            return itemBarcode === barcode;

        });


    if(!product){

        alert(
            "등록된 상품을 찾을 수 없습니다.\n\n"
            +
            "바코드: "
            +
            barcode
        );


        input.value = "";

        focusInput("barcodeInput");

        return;
    }


    currentProduct =
        product;


    saveLocalData();


    showQuantityScreen();
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

    currentProduct = null;

    currentRack = "";


    saveLocalData();


    showRackScreen();
}


/* =========================================================
   소비기한 + 박스수 + 낱개수량 화면
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

                <b>
                    ${product["입수량"]}
                </b>

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
                 박스수
            ================================================= -->

            <div class="qty-title">
                박스수
            </div>


            <input
                id="boxQuantity"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="박스수 입력"
                oninput="calculateTotalQuantity()"
                onkeydown="boxQuantityKeyDown(event)"
            >


            <!-- =================================================
                 낱개수량
            ================================================= -->

            <div class="qty-title">
                낱개수량
            </div>


            <input
                id="singleQuantity"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="낱개수량 입력"
                oninput="calculateTotalQuantity()"
                onkeydown="singleQuantityKeyDown(event)"
            >


            <!-- =================================================
                 자동 계산 수량
            ================================================= -->

            <div class="qty-title">
                총 수량
            </div>


            <div
                id="totalQuantity"
                class="qty-result"
            >
                0
            </div>


            <!-- =================================================
                 계산식 표시
            ================================================= -->

            <div
                id="quantityFormula"
                class="status"
                style="text-align:center;"
            >
                0 × ${product["입수량"]} + 0 = 0
            </div>


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
     * 제품 확인 후
     * 소비기한 년도에 자동 포커스
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


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


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


    if(
        input.value.length >= 2
    ){

        input.value =
            input.value.substring(
                0,
                2
            );


        /*
         * 소비기한 입력 완료
         * → 박스수 입력
         */

        focusInput(
            "boxQuantity"
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
         * → 박스수
         */

        focusInput(
            "boxQuantity"
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
   박스수 입력
========================================================= */

function boxQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    /*
     * 박스수 입력 후
     * → 낱개수량
     */

    focusInput(
        "singleQuantity"
    );
}


/* =========================================================
   낱개수량 입력
========================================================= */

function singleQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    /*
     * 낱개수량 입력 후
     * → 총수량 자동 계산
     */

    calculateTotalQuantity();


    /*
     * 바로 저장하지 않고
     * 사용자가 총 수량 확인 후 저장
     */

    document
        .getElementById(
            "saveQuantityBtn"
        )
        ?.focus();
}


/* =========================================================
   총 수량 자동 계산
========================================================= */

function calculateTotalQuantity(){

    if(!currentProduct){

        return 0;
    }


    /*
     * 입수량
     */

    const intake =
        cleanNumber(
            currentProduct["입수량"]
        );


    /*
     * 박스수
     */

    const boxInput =
        document.getElementById(
            "boxQuantity"
        );


    const boxQuantity =
        cleanNumber(
            boxInput?.value
        );


    /*
     * 낱개수량
     */

    const singleInput =
        document.getElementById(
            "singleQuantity"
        );


    const singleQuantity =
        cleanNumber(
            singleInput?.value
        );


    /*
     * =====================================================
     * 총 수량 계산
     *
     * 박스수 × 입수량 + 낱개수량
     * =====================================================
     */

    const total =
        (
            boxQuantity * intake
        )
        +
        singleQuantity;


    /*
     * 총 수량 표시
     */

    const totalElement =
        document.getElementById(
            "totalQuantity"
        );


    if(totalElement){

        totalElement.textContent =
            total.toLocaleString();
    }


    /*
     * 계산식 표시
     */

    const formulaElement =
        document.getElementById(
            "quantityFormula"
        );


    if(formulaElement){

        formulaElement.textContent =
            boxQuantity.toLocaleString()
            + " × "
            + intake.toLocaleString()
            + " + "
            + singleQuantity.toLocaleString()
            + " = "
            + total.toLocaleString();
    }


    return total;
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
     * =====================================================
     * 박스수
     * =====================================================
     */

    const boxInput =
        document.getElementById(
            "boxQuantity"
        );


    const boxQuantity =
        cleanNumber(
            boxInput?.value
        );


    /*
     * =====================================================
     * 낱개수량
     * =====================================================
     */

    const singleInput =
        document.getElementById(
            "singleQuantity"
        );


    const singleQuantity =
        cleanNumber(
            singleInput?.value
        );


    /*
     * =====================================================
     * 입수량
     * =====================================================
     */

    const intake =
        cleanNumber(
            currentProduct["입수량"]
        );


    /*
     * =====================================================
     * 최종 총 수량
     *
     * 박스수 × 입수량 + 낱개수량
     * =====================================================
     */

    const quantity =
        (
            boxQuantity * intake
        )
        +
        singleQuantity;


    /*
     * 수량 0 체크
     */

    if(quantity <= 0){

        alert(
            "박스수 또는 낱개수량을 입력해주세요."
        );


        focusInput(
            "boxQuantity"
        );


        return;
    }


    /*
     * =====================================================
     * 시트1 저장
     *
     * A = 바코드
     * B = 랙
     * C = 소비기한
     * D = 수량
     * E = 상품명
     * F = 화주사
     * =====================================================
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
     * 다음 조사
     */

    currentRack = "";

    currentProduct = null;


    saveLocalData();


    /*
     * 다시 랙 스캔
     */

    showRackScreen();
}


/* =========================================================
   서버 저장
========================================================= */

async function saveToServer(){

    if(
        !inventoryData
        ||
        inventoryData.length === 0
    ){

        alert(
            "저장할 조사 데이터가 없습니다."
        );

        return null;
    }


    try{

        const mappingData =
            getMappingData();


        const response =
            await fetch(
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
                                inventoryData,

                            mapping:
                                mappingData

                        })

                }
            );


        if(!response.ok){

            throw new Error(
                "서버 저장 실패: "
                +
                response.status
            );
        }


        const result =
            await response.json();


        /*
         * 서버가 file_id 또는 fileId를
         * 반환하는 경우 모두 처리
         */

        fileId =
            result.file_id
            ||
            result.fileId
            ||
            result.id
            ||
            null;


        return result;


    }catch(error){

        console.error(
            "서버 저장 오류:",
            error
        );


        alert(
            "서버 저장 중 오류가 발생했습니다.\n\n"
            +
            error.message
        );


        return null;
    }
}


/* =========================================================
   다운로드
========================================================= */

async function download(){

    if(
        !inventoryData
        ||
        inventoryData.length === 0
    ){

        alert(
            "저장할 조사 데이터가 없습니다."
        );

        return;
    }


    const result =
        await saveToServer();


    if(!result){

        return;
    }


    const id =
        result.file_id
        ||
        result.fileId
        ||
        result.id;


    if(!id){

        alert(
            "파일 ID를 받지 못했습니다."
        );

        return;
    }


    fileId = id;


    window.location.href =
        "/download/"
        +
        encodeURIComponent(id);
}


/* =========================================================
   공유
========================================================= */

async function share(){

    if(
        !inventoryData
        ||
        inventoryData.length === 0
    ){

        alert(
            "공유할 조사 데이터가 없습니다."
        );

        return;
    }


    const result =
        await saveToServer();


    if(!result){

        return;
    }


    const id =
        result.file_id
        ||
        result.fileId
        ||
        result.id;


    if(!id){

        alert(
            "파일 ID를 받지 못했습니다."
        );

        return;
    }


    fileId = id;


    const shareUrl =
        window.location.origin
        +
        "/share/"
        +
        encodeURIComponent(id);


    /*
     * Web Share 지원
     */

    if(
        navigator.share
    ){

        try{

            await navigator.share({

                title:
                    "ourbox 오산센터 재고조사",

                text:
                    "재고조사 결과",

                url:
                    shareUrl

            });


            return;

        }catch(error){

            /*
             * 사용자가 공유창을 닫은 경우
             * 아무것도 하지 않음
             */

            if(
                error
                &&
                error.name === "AbortError"
            ){

                return;
            }

        }
    }


    /*
     * Web Share 미지원
     */

    showManualCopy(shareUrl);
}


/* =========================================================
   수동 복사
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    const oldContent =
        app.innerHTML;


    app.innerHTML = `

        <div class="card">

            <div class="qty-title">
                공유 링크
            </div>


            <input
                id="shareUrlInput"
                type="text"
                value="${escapeHtml(url)}"
                readonly
            >


            <button
                onclick="copyShareUrl()"
            >
                링크 복사
            </button>


            <button
                onclick="showRackScreen()"
            >
                닫기
            </button>

        </div>

    `;


    focusInput("shareUrlInput");
}


/* =========================================================
   공유 링크 복사
========================================================= */

async function copyShareUrl(){

    const input =
        document.getElementById(
            "shareUrlInput"
        );


    if(!input){

        return;
    }


    const url =
        input.value;


    try{

        await navigator.clipboard.writeText(
            url
        );


        alert(
            "공유 링크가 복사되었습니다."
        );


    }catch(error){

        input.select();

        document.execCommand(
            "copy"
        );


        alert(
            "공유 링크가 복사되었습니다."
        );
    }
}


/* =========================================================
   QR 생성
========================================================= */

async function createQR(){

    if(
        !inventoryData
        ||
        inventoryData.length === 0
    ){

        alert(
            "QR로 만들 조사 데이터가 없습니다."
        );

        return;
    }


    const result =
        await saveToServer();


    if(!result){

        return;
    }


    const id =
        result.file_id
        ||
        result.fileId
        ||
        result.id;


    if(!id){

        alert(
            "파일 ID를 받지 못했습니다."
        );

        return;
    }


    fileId = id;


    const qrUrl =
        "/qr/"
        +
        encodeURIComponent(id);


    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div
                class="qty-title"
                style="text-align:center;"
            >
                재고조사 결과 QR
            </div>


            <div
                style="
                    text-align:center;
                    margin-top:20px;
                "
            >

                <img
                    src="${qrUrl}"
                    alt="QR Code"
                    style="
                        max-width:100%;
                        width:300px;
                        height:auto;
                    "
                >

            </div>


            <button
                onclick="closeQR()"
            >
                닫기
            </button>

        </div>

    `;
}


/* =========================================================
   QR 닫기
========================================================= */

function closeQR(){

    showRackScreen();
}


/* =========================================================
   업로드 폼 처리
========================================================= */

function setupUploadForm(){

    const form =
        document.getElementById(
            "uploadForm"
        );


    if(!form){

        return;
    }


    /*
     * 기존 index.html의
     *
     * action="/upload"
     * method="post"
     *
     * 구조를 그대로 사용한다.
     *
     * JavaScript에서는 업로드 자체를 가로채지 않는다.
     *
     * Flask가 /upload 처리 후
     * mapping을 다시 전달하도록 되어 있기 때문.
     */

}


/* =========================================================
   페이지 시작
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        setupUploadForm();

        init();

    }
);
