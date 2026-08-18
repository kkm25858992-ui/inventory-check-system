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

    if(
        typeof mapping === "undefined"
        ||
        mapping === null
    ){

        return [];
    }


    if(Array.isArray(mapping)){

        return mapping;
    }


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


    const uploadBox =
        document.getElementById(
            "uploadBox"
        );


    if(data.length > 0){

        if(uploadBox){

            uploadBox.style.display =
                "none";
        }


        showRackScreen();

        return;
    }


    if(uploadBox){

        uploadBox.style.display =
            "block";
    }


    showUploadMessage();
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


            <!-- =================================================
                 신규 재고등록
            ================================================= -->

            <button
                class="new-inventory-btn"
                onclick="showNewInventoryScreen()"
            >
                신규 재고등록
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
   =========================================================
   신규 재고등록
   =========================================================
========================================================= */


/* =========================================================
   신규 재고등록 화면
========================================================= */

function showNewInventoryScreen(){

    currentProduct = null;


    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div
                class="qty-title"
                style="margin-top:0;"
            >
                신규 재고등록
            </div>


            <!-- =============================================
                 랙
            ============================================== -->

            <div class="qty-title">
                랙
            </div>


            <input
                id="newRackInput"
                type="text"
                inputmode="text"
                autocomplete="off"
                placeholder="랙을 입력하거나 스캔하세요"
                value="${escapeHtml(currentRack)}"
                onkeydown="newRackKeyDown(event)"
            >


            <!-- =============================================
                 상품명
            ============================================== -->

            <div class="qty-title">
                상품명
            </div>


            <input
                id="newProductNameInput"
                type="text"
                autocomplete="off"
                placeholder="상품명을 입력하세요"
                oninput="searchNewProductName()"
                onkeydown="newProductNameKeyDown(event)"
            >


            <!-- =============================================
                 상품 검색 결과
            ============================================== -->

            <div
                id="newProductSearchResults"
                class="product-search-results"
            ></div>


            <!-- =============================================
                 선택된 화주사
            ============================================== -->

            <div
                id="newProductOwner"
                class="selected-product-info"
                style="display:none;"
            ></div>


            <!-- =============================================
                 소비기한
            ============================================== -->

            <div class="date-title">
                소비기한
            </div>


            <div class="date-inputs">

                <input
                    id="newExpiryYear"
                    class="date-year"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="년"
                    autocomplete="off"
                    oninput="newExpiryYearInput()"
                    onkeydown="newDateKeyDown(event)"
                >


                <span class="date-separator">
                    -
                </span>


                <input
                    id="newExpiryMonth"
                    class="date-month"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="월"
                    autocomplete="off"
                    oninput="newExpiryMonthInput()"
                    onkeydown="newDateKeyDown(event)"
                >


                <span class="date-separator">
                    -
                </span>


                <input
                    id="newExpiryDay"
                    class="date-day"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="일"
                    autocomplete="off"
                    oninput="newExpiryDayInput()"
                    onkeydown="newDateKeyDown(event)"
                >

            </div>


            <!-- =============================================
                 수량
            ============================================== -->

            <div class="qty-title">
                수량
            </div>


            <input
                id="newQuantityInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="수량을 입력하세요"
                oninput="cleanNewQuantityInput()"
                onkeydown="newQuantityKeyDown(event)"
            >


            <!-- =============================================
                 저장
            ============================================== -->

            <button
                class="save-qty-btn"
                onclick="saveNewInventory()"
            >
                신규 재고 저장
            </button>


            <button
                onclick="showProductScreen()"
            >
                취소
            </button>

        </div>

    `;


    focusInput("newRackInput");
}


/* =========================================================
   신규 랙 Enter
========================================================= */

function newRackKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    focusInput(
        "newProductNameInput"
    );
}


/* =========================================================
   신규 상품명 검색
========================================================= */

function searchNewProductName(){

    const input =
        document.getElementById(
            "newProductNameInput"
        );


    const resultBox =
        document.getElementById(
            "newProductSearchResults"
        );


    if(!input || !resultBox){

        return;
    }


    const keyword =
        input.value
            .trim()
            .toLowerCase();


    /*
     * 검색어가 없으면
     * 검색결과 숨김
     */

    if(!keyword){

        resultBox.innerHTML = "";

        resultBox.style.display =
            "none";

        return;
    }


    const mappingData =
        getMappingData();


    /*
     * 상품명 기준 검색
     */

    const results =
        mappingData.filter(function(item){

            const productName =
                String(
                    item["상품명"] ?? ""
                )
                .trim()
                .toLowerCase();


            return (
                productName
                .includes(keyword)
            );

        });


    /*
     * 최대 15개 표시
     */

    const limitedResults =
        results.slice(
            0,
            15
        );


    if(limitedResults.length === 0){

        resultBox.innerHTML = `

            <div class="no-search-result">

                일치하는 상품이 없습니다.

            </div>

        `;

        resultBox.style.display =
            "block";

        return;
    }


    /*
     * 검색 결과 생성
     */

    resultBox.innerHTML =
        limitedResults.map(function(item, index){

            return `

                <div
                    class="product-search-item"
                    onclick="selectNewProduct(${mappingData.indexOf(item)})"
                >

                    <div class="product-search-name">

                        ${escapeHtml(
                            item["상품명"]
                        )}

                    </div>


                    <div class="product-search-sub">

                        ${escapeHtml(
                            item["화주사"] || ""
                        )}

                        ${
                            item["바코드"]
                            ?
                            " · " +
                            escapeHtml(
                                item["바코드"]
                            )
                            :
                            ""
                        }

                    </div>

                </div>

            `;

        }).join("");


    resultBox.style.display =
        "block";
}


/* =========================================================
   신규 상품 선택
========================================================= */

function selectNewProduct(index){

    const mappingData =
        getMappingData();


    const product =
        mappingData[index];


    if(!product){

        return;
    }


    const nameInput =
        document.getElementById(
            "newProductNameInput"
        );


    const resultBox =
        document.getElementById(
            "newProductSearchResults"
        );


    const ownerBox =
        document.getElementById(
            "newProductOwner"
        );


    /*
     * 상품명 자동 입력
     */

    if(nameInput){

        nameInput.value =
            String(
                product["상품명"] ?? ""
            ).trim();
    }


    /*
     * 화주사 표시
     */

    if(ownerBox){

        const owner =
            String(
                product["화주사"] ?? ""
            ).trim();


        if(owner){

            ownerBox.innerHTML =

                "화주사 : <b>"
                +
                escapeHtml(owner)
                +
                "</b>";

            ownerBox.style.display =
                "block";

        }else{

            ownerBox.innerHTML = "";

            ownerBox.style.display =
                "none";
        }

    }


    /*
     * 검색 결과 닫기
     */

    if(resultBox){

        resultBox.innerHTML = "";

        resultBox.style.display =
            "none";
    }


    /*
     * 상품 선택 정보 저장
     *
     * 신규재고이므로
     * 바코드는 저장하지 않음.
     */

    currentProduct = {

        "상품명":
            product["상품명"] || "",

        "화주사":
            product["화주사"] || "",

        "바코드":
            ""

    };


    focusInput(
        "newExpiryYear"
    );
}


/* =========================================================
   신규 상품명 Enter
========================================================= */

function newProductNameKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const input =
        document.getElementById(
            "newProductNameInput"
        );


    if(!input){

        return;
    }


    const keyword =
        input.value.trim();


    if(!keyword){

        alert(
            "상품명을 입력해주세요."
        );

        return;
    }


    const mappingData =
        getMappingData();


    /*
     * 정확히 일치하는 상품 우선
     */

    const exact =
        mappingData.find(function(item){

            return String(
                item["상품명"] ?? ""
            ).trim()
            === keyword;

        });


    if(exact){

        selectNewProduct(
            mappingData.indexOf(exact)
        );

        return;
    }


    /*
     * 연관검색 첫 번째 상품 선택
     */

    const first =
        mappingData.find(function(item){

            const name =
                String(
                    item["상품명"] ?? ""
                )
                .trim()
                .toLowerCase();


            return name.includes(
                keyword.toLowerCase()
            );

        });


    if(first){

        selectNewProduct(
            mappingData.indexOf(first)
        );

        return;
    }


    /*
     * 상품마스터에 없어도
     * 신규상품으로 직접 입력 가능
     */

    currentProduct = {

        "상품명":
            keyword,

        "화주사":
            "",

        "바코드":
            ""

    };


    const resultBox =
        document.getElementById(
            "newProductSearchResults"
        );


    if(resultBox){

        resultBox.innerHTML = "";

        resultBox.style.display =
            "none";
    }


    focusInput(
        "newExpiryYear"
    );
}


/* =========================================================
   신규 소비기한 - 년
========================================================= */

function newExpiryYearInput(){

    const input =
        document.getElementById(
            "newExpiryYear"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    if(input.value.length >= 4){

        input.value =
            input.value.substring(
                0,
                4
            );


        focusInput(
            "newExpiryMonth"
        );
    }
}


/* =========================================================
   신규 소비기한 - 월
========================================================= */

function newExpiryMonthInput(){

    const input =
        document.getElementById(
            "newExpiryMonth"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    if(input.value.length >= 2){

        input.value =
            input.value.substring(
                0,
                2
            );


        focusInput(
            "newExpiryDay"
        );
    }
}


/* =========================================================
   신규 소비기한 - 일
========================================================= */

function newExpiryDayInput(){

    const input =
        document.getElementById(
            "newExpiryDay"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    if(input.value.length >= 2){

        input.value =
            input.value.substring(
                0,
                2
            );


        focusInput(
            "newQuantityInput"
        );
    }
}


/* =========================================================
   신규 날짜 Enter
========================================================= */

function newDateKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const id =
        event.target.id;


    if(id === "newExpiryYear"){

        focusInput(
            "newExpiryMonth"
        );

    }
    else if(id === "newExpiryMonth"){

        focusInput(
            "newExpiryDay"
        );

    }
    else if(id === "newExpiryDay"){

        focusInput(
            "newQuantityInput"
        );
    }
}


/* =========================================================
   신규 수량 입력
========================================================= */

function cleanNewQuantityInput(){

    const input =
        document.getElementById(
            "newQuantityInput"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );
}


/* =========================================================
   신규 수량 Enter
========================================================= */

function newQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    saveNewInventory();
}


/* =========================================================
   신규 소비기한 가져오기
========================================================= */

function getNewExpiryDate(){

    const year =
        document.getElementById(
            "newExpiryYear"
        )?.value.trim() || "";


    const month =
        document.getElementById(
            "newExpiryMonth"
        )?.value.trim() || "";


    const day =
        document.getElementById(
            "newExpiryDay"
        )?.value.trim() || "";


    /*
     * 전부 비어 있으면 빈 값
     */

    if(
        !year &&
        !month &&
        !day
    ){

        return "";
    }


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
            "newExpiryMonth"
        );


        return null;
    }


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
            "newExpiryDay"
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
   신규 재고 저장
========================================================= */

function saveNewInventory(){

    const rackInput =
        document.getElementById(
            "newRackInput"
        );


    const productInput =
        document.getElementById(
            "newProductNameInput"
        );


    const quantityInput =
        document.getElementById(
            "newQuantityInput"
        );


    if(
        !rackInput
        ||
        !productInput
        ||
        !quantityInput
    ){

        return;
    }


    const rack =
        rackInput.value.trim();


    const productName =
        productInput.value.trim();


    const quantity =
        cleanNumber(
            quantityInput.value
        );


    /*
     * 랙 확인
     */

    if(!rack){

        alert(
            "랙을 입력해주세요."
        );


        focusInput(
            "newRackInput"
        );


        return;
    }


    /*
     * 상품명 확인
     */

    if(!productName){

        alert(
            "상품명을 입력해주세요."
        );


        focusInput(
            "newProductNameInput"
        );


        return;
    }


    /*
     * 소비기한
     */

    const expiry =
        getNewExpiryDate();


    if(expiry === null){

        return;
    }


    /*
     * 수량
     */

    if(quantity <= 0){

        alert(
            "수량을 입력해주세요."
        );


        focusInput(
            "newQuantityInput"
        );


        return;
    }


    /*
     * 화주사
     *
     * 상품마스터에서 선택했다면 자동 적용
     * 직접 입력한 신규상품이면 빈칸
     */

    let owner = "";


    if(currentProduct){

        owner =
            String(
                currentProduct["화주사"] ?? ""
            ).trim();
    }


    /*
     * =====================================================
     * 신규 재고 저장
     *
     * 바코드는 빈칸
     * =====================================================
     */

    inventoryData.push({

        "바코드":
            "",

        "랙":
            rack,

        "소비기한":
            expiry,

        "수량":
            quantity,

        "상품명":
            productName,

        "화주사":
            owner

    });


    inventoryCount =
        inventoryData.length;


    /*
     * localStorage 저장
     */

    saveLocalData();


    /*
     * 초기화
     */

    currentProduct = null;

    currentRack = "";


    saveLocalData();


    alert(
        "신규 재고가 등록되었습니다."
    );


    /*
     * 다시 랙 입력 화면
     */

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

            <div class="info-row">

                <span class="info-label">
                    현재 랙:
                </span>

                ${escapeHtml(currentRack)}

            </div>


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

                <b>
                    ${product["입수량"]}
                </b>

            </div>


            <div class="date-title">
                소비기한
            </div>


            <div class="date-inputs">

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


            <div class="qty-title">
                총 수량
            </div>


            <div
                id="totalQuantity"
                class="qty-result"
            >
                0
            </div>


            <div
                id="quantityFormula"
                class="status"
                style="text-align:center;"
            >
                0 × ${product["입수량"]} + 0 = 0
            </div>


            <button
                id="saveQuantityBtn"
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
        "expiryYear"
    );
}


/* =========================================================
   날짜 - 년
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


    if(input.value.length >= 4){

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


    if(input.value.length >= 2){

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


    if(input.value.length >= 2){

        input.value =
            input.value.substring(
                0,
                2
            );


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


    if(
        !year &&
        !month &&
        !day
    ){

        return "";
    }


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
   박스수 Enter
========================================================= */

function boxQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    focusInput(
        "singleQuantity"
    );
}


/* =========================================================
   낱개수량 Enter
========================================================= */

function singleQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    calculateTotalQuantity();


    document
        .getElementById(
            "saveQuantityBtn"
        )
        ?.focus();
}


/* =========================================================
   총 수량 계산
========================================================= */

function calculateTotalQuantity(){

    if(!currentProduct){

        return 0;
    }


    const intake =
        cleanNumber(
            currentProduct["입수량"]
        );


    const boxInput =
        document.getElementById(
            "boxQuantity"
        );


    const boxQuantity =
        cleanNumber(
            boxInput?.value
        );


    const singleInput =
        document.getElementById(
            "singleQuantity"
        );


    const singleQuantity =
        cleanNumber(
            singleInput?.value
        );


    const total =
        (
            boxQuantity * intake
        )
        +
        singleQuantity;


    const totalElement =
        document.getElementById(
            "totalQuantity"
        );


    if(totalElement){

        totalElement.textContent =
            total.toLocaleString();
    }


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
   기존 재고 수량 저장
========================================================= */

function saveQuantity(){

    if(!currentProduct){

        return;
    }


    const expiry =
        getExpiryDate();


    if(expiry === null){

        return;
    }


    const boxInput =
        document.getElementById(
            "boxQuantity"
        );


    const boxQuantity =
        cleanNumber(
            boxInput?.value
        );


    const singleInput =
        document.getElementById(
            "singleQuantity"
        );


    const singleQuantity =
        cleanNumber(
            singleInput?.value
        );


    const intake =
        cleanNumber(
            currentProduct["입수량"]
        );


    const quantity =
        (
            boxQuantity * intake
        )
        +
        singleQuantity;


    if(quantity <= 0){

        alert(
            "박스수 또는 낱개수량을 입력해주세요."
        );


        focusInput(
            "boxQuantity"
        );


        return;
    }


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


    saveLocalData();


    currentRack = "";

    currentProduct = null;


    saveLocalData();


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


    if(navigator.share){

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

            if(
                error
                &&
                error.name === "AbortError"
            ){

                return;
            }

        }
    }


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
   업로드 폼
========================================================= */

function setupUploadForm(){

    const form =
        document.getElementById(
            "uploadForm"
        );


    if(!form){

        return;
    }

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
