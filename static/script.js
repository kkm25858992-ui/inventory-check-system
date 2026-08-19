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

/*
 * 조사 완료건 수정 상태
 * -1이면 수정 중인 건이 없습니다.
 */
let editingInventoryIndex = -1;


/* =========================================================
   상품 마스터 데이터
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
   입력 포커스
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
   새 재고조사 초기화
========================================================= */

function resetInventoryForNewUpload(){

    inventoryData = [];

    currentIndex = 0;

    currentRack = "";

    currentProduct = null;

    inventoryCount = 0;

    fileId = null;
    editingInventoryIndex = -1;


    /*
     * 이전 조사 데이터 삭제
     */

    localStorage.removeItem(
        "inventoryData"
    );


    localStorage.removeItem(
        "currentRack"
    );


    localStorage.removeItem(
        "currentIndex"
    );
}


/* =========================================================
   초기화
========================================================= */

function init(){

    editingInventoryIndex = -1;

    data =
        getMappingData();


    /*
     * =====================================================
     * 새 엑셀을 업로드한 경우
     *
     * 기존 재고조사 데이터 제거
     * =====================================================
     */

    if(
        typeof newUpload !== "undefined"
        &&
        newUpload === true
    ){

        resetInventoryForNewUpload();

    }
    else{

        /*
         * 기존 조사 이어하기
         */

        loadLocalData();

    }


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


            <button
                class="completed-btn"
                onclick="showCompletedInventoryScreen()"
            >
                조사 완료건
                <b>
                    ${inventoryData.length}
                </b>
                건 - 선택하여 수정
            </button>


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
   조사 완료건 목록
========================================================= */

function showCompletedInventoryScreen(){

    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    if(
        !inventoryData
        ||
        inventoryData.length === 0
    ){

        alert(
            "조사 완료된 건이 없습니다."
        );

        showRackScreen();
        return;
    }


    const rows =
        inventoryData
        .map(function(item, index){

            const barcode =
                String(item["바코드"] ?? "").trim();

            const rack =
                String(item["랙"] ?? "").trim();

            const expiry =
                String(item["소비기한"] ?? "").trim();

            const quantity =
                cleanNumber(item["수량"]);

            const productName =
                String(item["상품명"] ?? "").trim();

            const owner =
                String(item["화주사"] ?? "").trim();


            return `

                <div class="completed-item">

                    <div class="completed-item-title">
                        ${index + 1}번 조사
                    </div>


                    <div class="completed-item-info">

                        <div>
                            <b>상품명:</b>
                            ${escapeHtml(productName || "신규 재고")}
                        </div>

                        <div>
                            <b>화주사:</b>
                            ${escapeHtml(owner)}
                        </div>

                        <div>
                            <b>바코드:</b>
                            ${escapeHtml(barcode || "-")}
                        </div>

                        <div>
                            <b>랙:</b>
                            ${escapeHtml(rack || "-")}
                        </div>

                        <div>
                            <b>소비기한:</b>
                            ${escapeHtml(expiry || "-")}
                        </div>

                        <div>
                            <b>수량:</b>
                            ${quantity.toLocaleString()}
                        </div>

                    </div>


                    <button
                        class="edit-btn"
                        onclick="showEditInventoryScreen(${index})"
                    >
                        이 조사건 수정
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteInventoryItem(${index})"
                    >
                        잘못 등록한 조사건 삭제
                    </button>

                </div>

            `;

        })
        .join("");


    app.innerHTML = `

        <div class="card">

            <div class="new-title">
                조사 완료건
            </div>


            <div
                class="status"
                style="text-align:center;"
            >
                총
                <b>${inventoryData.length}</b>
                건의 조사 완료건이 있습니다.
                <br>
                수정할 조사건을 선택해주세요.
            </div>


            <div class="completed-list">
                ${rows}
            </div>


            <button
                class="back-btn"
                onclick="showRackScreen()"
            >
                조사 화면으로 돌아가기
            </button>

        </div>

    `;
}


/* =========================================================
   조사 완료건 수정 화면
========================================================= */

function showEditInventoryScreen(index){

    if(
        !Number.isInteger(index)
        ||
        index < 0
        ||
        index >= inventoryData.length
    ){

        alert(
            "수정할 조사건을 찾을 수 없습니다."
        );

        showCompletedInventoryScreen();
        return;
    }


    editingInventoryIndex = index;


    const item =
        inventoryData[index];


    const app =
        document.getElementById("app");


    if(!app){

        return;
    }


    const barcode =
        String(item["바코드"] ?? "").trim();

    const productName =
        String(item["상품명"] ?? "").trim();

    const owner =
        String(item["화주사"] ?? "").trim();

    const rack =
        String(item["랙"] ?? "").trim();

    const expiry =
        String(item["소비기한"] ?? "").trim();

    const quantity =
        cleanNumber(item["수량"]);


    let expiryYear = "";
    let expiryMonth = "";
    let expiryDay = "";


    if(/^\d{4}-\d{2}-\d{2}$/.test(expiry)){

        const parts = expiry.split("-");

        expiryYear = parts[0];
        expiryMonth = parts[1];
        expiryDay = parts[2];
    }


    app.innerHTML = `

        <div class="card">

            <div class="new-title">
                조사 완료건 수정
            </div>


            <div class="status">
                <b>${index + 1}번 조사건</b>을 수정합니다.
            </div>


            <div class="info-row">
                <span class="info-label">바코드:</span>
                ${escapeHtml(barcode || "-")}
            </div>


            <div class="info-row">
                <span class="info-label">화주사:</span>
                ${escapeHtml(owner || "-")}
            </div>


            <div class="qty-title">
                상품명
            </div>

            <div class="autocomplete-container">

                <input
                    id="editProductNameInput"
                    type="text"
                    autocomplete="off"
                    value="${escapeHtml(productName)}"
                    placeholder="상품명을 입력하세요"
                    oninput="searchEditProductName()"
                    onkeydown="editProductNameKeyDown(event)"
                >

                <div
                    id="editProductSuggestions"
                    class="product-suggestions"
                ></div>

            </div>


            <div class="qty-title">
                랙
            </div>

            <input
                id="editRackInput"
                type="text"
                inputmode="text"
                autocomplete="off"
                value="${escapeHtml(rack)}"
                placeholder="랙을 입력하세요"
                onkeydown="editRackKeyDown(event)"
            >


            <div class="date-title">
                소비기한
            </div>


            <div class="date-inputs">

                <input
                    id="editExpiryYear"
                    class="date-year"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    value="${escapeHtml(expiryYear)}"
                    placeholder="년"
                    autocomplete="off"
                    oninput="editDateYearInput()"
                    onkeydown="editDateKeyDown(event)"
                >

                <span class="date-separator">-</span>

                <input
                    id="editExpiryMonth"
                    class="date-month"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    value="${escapeHtml(expiryMonth)}"
                    placeholder="월"
                    autocomplete="off"
                    oninput="editDateMonthInput()"
                    onkeydown="editDateKeyDown(event)"
                >

                <span class="date-separator">-</span>

                <input
                    id="editExpiryDay"
                    class="date-day"
                    type="text"
                    inputmode="numeric"
                    maxlength="2"
                    value="${escapeHtml(expiryDay)}"
                    placeholder="일"
                    autocomplete="off"
                    oninput="editDateDayInput()"
                    onkeydown="editDateKeyDown(event)"
                >

            </div>


            <div class="qty-title">
                총 수량
            </div>

            <input
                id="editQuantityInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                value="${quantity}"
                placeholder="수량을 입력하세요"
                onkeydown="editQuantityKeyDown(event)"
            >


            <div
                class="status"
                style="text-align:center;"
            >
                현재 수량:
                <b>${quantity.toLocaleString()}</b>
            </div>


            <button
                class="save-new-btn"
                onclick="saveEditedInventory()"
            >
                수정 내용 저장
            </button>


            <button
                onclick="showCompletedInventoryScreen()"
            >
                수정 취소
            </button>

        </div>

    `;


    focusInput("editProductNameInput");
}


/* =========================================================
   수정 - 상품명 검색
========================================================= */

function searchEditProductName(){

    const input =
        document.getElementById("editProductNameInput");

    const suggestionBox =
        document.getElementById("editProductSuggestions");

    if(!input || !suggestionBox){
        return;
    }

    const keyword =
        input.value
            .trim()
            .toLowerCase();

    if(!keyword){

        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
        window.editProductSearchResults = [];
        return;
    }

    const mappingData =
        getMappingData();

    const results =
        mappingData.filter(function(item){

            const productName =
                String(item["상품명"] ?? "")
                    .trim();

            return productName
                .toLowerCase()
                .includes(keyword);
        });

    const limitedResults =
        results.slice(0, 20);

    window.editProductSearchResults =
        limitedResults;

    if(limitedResults.length === 0){

        suggestionBox.innerHTML = `
            <div class="no-suggestion">
                검색 결과가 없습니다.
            </div>
        `;

        suggestionBox.style.display = "block";
        return;
    }

    suggestionBox.innerHTML =
        limitedResults
            .map(function(item, index){

                return `
                    <div
                        class="product-suggestion"
                        onclick="selectEditProduct(${index})"
                    >
                        <div class="suggestion-name">
                            ${escapeHtml(item["상품명"])}
                        </div>

                        <div class="suggestion-info">
                            화주사:
                            ${escapeHtml(item["화주사"])}
                            &nbsp; | &nbsp;
                            바코드:
                            ${escapeHtml(item["바코드"])}
                        </div>
                    </div>
                `;
            })
            .join("");

    suggestionBox.style.display = "block";
}


/* =========================================================
   수정 - 상품명 검색 결과 선택
========================================================= */

function selectEditProduct(index){

    const results =
        window.editProductSearchResults
        || [];

    const product =
        results[index];

    if(!product){
        return;
    }

    const input =
        document.getElementById("editProductNameInput");

    const suggestionBox =
        document.getElementById("editProductSuggestions");

    if(input){
        input.value =
            String(product["상품명"] ?? "").trim();
    }

    if(suggestionBox){
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
    }
}


/* =========================================================
   수정 - 상품명 Enter
========================================================= */

function editProductNameKeyDown(event){

    if(event.key !== "Enter"){
        return;
    }

    event.preventDefault();

    const results =
        window.editProductSearchResults
        || [];

    if(results.length > 0){
        selectEditProduct(0);
    }

    focusInput("editRackInput");
}


/* =========================================================
   수정 - 랙 Enter
========================================================= */

function editRackKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();

    focusInput("editExpiryYear");
}


/* =========================================================
   수정 - 날짜 년
========================================================= */

function editDateYearInput(){

    const input =
        document.getElementById("editExpiryYear");


    if(!input){

        return;
    }


    input.value =
        input.value.replace(/[^0-9]/g, "");


    if(input.value.length >= 4){

        input.value =
            input.value.substring(0, 4);

        focusInput("editExpiryMonth");
    }
}


/* =========================================================
   수정 - 날짜 월
========================================================= */

function editDateMonthInput(){

    const input =
        document.getElementById("editExpiryMonth");


    if(!input){

        return;
    }


    input.value =
        input.value.replace(/[^0-9]/g, "");


    if(input.value.length >= 2){

        input.value =
            input.value.substring(0, 2);

        focusInput("editExpiryDay");
    }
}


/* =========================================================
   수정 - 날짜 일
========================================================= */

function editDateDayInput(){

    const input =
        document.getElementById("editExpiryDay");


    if(!input){

        return;
    }


    input.value =
        input.value.replace(/[^0-9]/g, "");


    if(input.value.length >= 2){

        input.value =
            input.value.substring(0, 2);

        focusInput("editQuantityInput");
    }
}


/* =========================================================
   수정 - 날짜 Enter
========================================================= */

function editDateKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const id =
        event.target.id;


    if(id === "editExpiryYear"){

        focusInput("editExpiryMonth");

    }
    else if(id === "editExpiryMonth"){

        focusInput("editExpiryDay");

    }
    else if(id === "editExpiryDay"){

        focusInput("editQuantityInput");
    }
}


/* =========================================================
   수정 - 수량 Enter
========================================================= */

function editQuantityKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();

    saveEditedInventory();
}


/* =========================================================
   수정 - 소비기한 읽기
========================================================= */

function getEditedExpiryDate(){

    const year =
        document.getElementById("editExpiryYear")?.value.trim() || "";

    const month =
        document.getElementById("editExpiryMonth")?.value.trim() || "";

    const day =
        document.getElementById("editExpiryDay")?.value.trim() || "";


    if(!year && !month && !day){

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

        focusInput("editExpiryMonth");

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

        focusInput("editExpiryDay");

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
   조사 완료건 삭제
========================================================= */

function deleteInventoryItem(index){

    if(
        !Number.isInteger(index)
        ||
        index < 0
        ||
        index >= inventoryData.length
    ){

        alert(
            "삭제할 조사건을 찾을 수 없습니다."
        );

        showCompletedInventoryScreen();
        return;
    }


    const item =
        inventoryData[index];

    const productName =
        String(item["상품명"] ?? "").trim()
        || "신규 재고";

    const rack =
        String(item["랙"] ?? "").trim()
        || "-";

    const quantity =
        cleanNumber(item["수량"]);


    const confirmed =
        confirm(
            "잘못 등록한 조사건을 삭제하시겠습니까?\n\n"
            + "상품명: " + productName + "\n"
            + "랙: " + rack + "\n"
            + "수량: " + quantity.toLocaleString() + "\n\n"
            + "삭제 후에는 해당 조사건이 복구되지 않습니다."
        );


    if(!confirmed){
        return;
    }


    inventoryData.splice(index, 1);

    inventoryCount =
        inventoryData.length;

    editingInventoryIndex = -1;

    saveLocalData();


    alert(
        "잘못 등록한 조사건이 삭제되었습니다."
    );

    showCompletedInventoryScreen();
}


/* =========================================================
   조사 완료건 수정 저장
========================================================= */

function saveEditedInventory(){

    if(
        !Number.isInteger(editingInventoryIndex)
        ||
        editingInventoryIndex < 0
        ||
        editingInventoryIndex >= inventoryData.length
    ){

        alert(
            "수정할 조사건을 찾을 수 없습니다."
        );

        showCompletedInventoryScreen();
        return;
    }


    const productNameInput =
        document.getElementById("editProductNameInput");

    const productName =
        productNameInput?.value.trim() || "";


    if(!productName){

        alert(
            "상품명을 입력해주세요."
        );

        focusInput("editProductNameInput");
        return;
    }


    const rackInput =
        document.getElementById("editRackInput");

    const rack =
        rackInput?.value.trim() || "";


    if(!rack){

        alert(
            "랙을 입력해주세요."
        );

        focusInput("editRackInput");
        return;
    }


    const expiry =
        getEditedExpiryDate();


    if(expiry === null){

        return;
    }


    const quantity =
        cleanNumber(
            document.getElementById("editQuantityInput")?.value
        );


    if(quantity <= 0){

        alert(
            "수량을 입력해주세요."
        );

        focusInput("editQuantityInput");
        return;
    }


    const item =
        inventoryData[editingInventoryIndex];


    item["상품명"] = productName;
    item["랙"] = rack;
    item["소비기한"] = expiry;
    item["수량"] = quantity;


    inventoryCount =
        inventoryData.length;


    saveLocalData();


    editingInventoryIndex = -1;


    alert(
        "조사 완료건이 수정되었습니다."
    );


    showCompletedInventoryScreen();
}


/* =========================================================
   랙 Enter
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


            <!-- 신규 재고등록 -->

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
   소비기한 + 수량 화면
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
   소비기한
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


    const boxQuantity =
        cleanNumber(
            document.getElementById(
                "boxQuantity"
            )?.value
        );


    const singleQuantity =
        cleanNumber(
            document.getElementById(
                "singleQuantity"
            )?.value
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
   기존 상품 수량 저장
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


    const boxQuantity =
        cleanNumber(
            document.getElementById(
                "boxQuantity"
            )?.value
        );


    const singleQuantity =
        cleanNumber(
            document.getElementById(
                "singleQuantity"
            )?.value
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
   =========================================================
   신규 재고등록
   =========================================================
   ========================================================= */


/* =========================================================
   신규 재고 화면
========================================================= */

function showNewInventoryScreen(){

    currentProduct = null;


    const app =
        document.getElementById(
            "app"
        );


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">

            <div class="new-title">
                신규 재고등록
            </div>


            <!-- =========================================
                 랙
            ========================================== -->

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


            <!-- =========================================
                 상품명
            ========================================== -->

            <div class="qty-title">
                상품명
            </div>


            <div class="autocomplete-container">

                <input
                    id="newProductNameInput"
                    type="text"
                    autocomplete="off"
                    placeholder="상품명을 입력하세요"
                    oninput="searchNewProductName()"
                    onkeydown="newProductNameKeyDown(event)"
                >


                <div
                    id="productSuggestions"
                    class="product-suggestions"
                ></div>

            </div>


            <!-- =========================================
                 선택된 화주사
            ========================================== -->

            <div
                id="newOwnerInfo"
                class="status"
                style="display:none;"
            >
            </div>


            <!-- =========================================
                 소비기한
            ========================================== -->

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
                    oninput="newDateYearInput()"
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
                    oninput="newDateMonthInput()"
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
                    oninput="newDateDayInput()"
                    onkeydown="newDateKeyDown(event)"
                >

            </div>


            <!-- =========================================
                 수량
            ========================================== -->

            <div class="qty-title">
                수량
            </div>


            <input
                id="newQuantityInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="수량을 입력하세요"
                onkeydown="newQuantityKeyDown(event)"
            >


            <!-- =========================================
                 저장
            ========================================== -->

            <button
                class="save-new-btn"
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


    /*
     * 신규 등록 시작 시
     * 현재 랙을 자동 입력
     */


    focusInput(
        "newRackInput"
    );
}


/* =========================================================
   신규 랙 Enter
========================================================= */

function newRackKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    const rack =
        document.getElementById(
            "newRackInput"
        )?.value.trim() || "";


    if(!rack){

        alert(
            "랙을 입력해주세요."
        );


        focusInput(
            "newRackInput"
        );


        return;
    }


    currentRack =
        rack;


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


    const suggestionBox =
        document.getElementById(
            "productSuggestions"
        );


    if(
        !input
        ||
        !suggestionBox
    ){

        return;
    }


    const keyword =
        input.value
            .trim()
            .toLowerCase();


    /*
     * 입력값이 없으면 검색결과 제거
     */

    if(!keyword){

        suggestionBox.innerHTML = "";

        suggestionBox.style.display =
            "none";

        return;
    }


    const mappingData =
        getMappingData();


    /*
     * 상품명에 입력 단어가 포함된 상품
     */

    const results =
        mappingData.filter(function(item){

            const productName =
                String(
                    item["상품명"] ?? ""
                )
                .trim();


            return productName
                .toLowerCase()
                .includes(keyword);

        });


    /*
     * 최대 20개
     */

    const limitedResults =
        results.slice(
            0,
            20
        );


    if(limitedResults.length === 0){

        suggestionBox.innerHTML = `

            <div class="no-suggestion">
                검색 결과가 없습니다.
            </div>

        `;


        suggestionBox.style.display =
            "block";


        return;
    }


    suggestionBox.innerHTML =
        limitedResults
        .map(function(item, index){

            return `

                <div
                    class="product-suggestion"
                    onclick="selectNewProduct(${index})"
                >

                    <div class="suggestion-name">
                        ${escapeHtml(item["상품명"])}
                    </div>

                    <div class="suggestion-info">

                        화주사:
                        ${escapeHtml(item["화주사"])}

                        &nbsp; | &nbsp;

                        바코드:
                        ${escapeHtml(item["바코드"])}

                    </div>

                </div>

            `;

        })
        .join("");


    /*
     * 현재 검색 결과를 임시 저장
     */

    window.newProductSearchResults =
        limitedResults;


    suggestionBox.style.display =
        "block";
}


/* =========================================================
   신규 상품 선택
========================================================= */

function selectNewProduct(index){

    const results =
        window.newProductSearchResults
        || [];


    const product =
        results[index];


    if(!product){

        return;
    }


    const input =
        document.getElementById(
            "newProductNameInput"
        );


    const suggestionBox =
        document.getElementById(
            "productSuggestions"
        );


    if(input){

        input.value =
            product["상품명"];
    }


    /*
     * 선택된 신규상품 저장
     */

    window.selectedNewProduct =
        product;


    /*
     * 화주사 표시
     */

    const ownerInfo =
        document.getElementById(
            "newOwnerInfo"
        );


    if(ownerInfo){

        ownerInfo.innerHTML =

            "<b>화주사:</b> "
            +
            escapeHtml(
                product["화주사"]
            );


        ownerInfo.style.display =
            "block";
    }


    if(suggestionBox){

        suggestionBox.innerHTML = "";

        suggestionBox.style.display =
            "none";
    }


    /*
     * 소비기한으로 이동
     */

    focusInput(
        "newExpiryYear"
    );
}


/* =========================================================
   신규 상품명 키보드
========================================================= */

function newProductNameKeyDown(event){

    if(event.key === "Enter"){

        event.preventDefault();


        const results =
            window.newProductSearchResults
            || [];


        if(results.length > 0){

            selectNewProduct(0);

        }
        else{

            focusInput(
                "newExpiryYear"
            );

        }

    }
}


/* =========================================================
   신규 날짜 - 년
========================================================= */

function newDateYearInput(){

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
   신규 날짜 - 월
========================================================= */

function newDateMonthInput(){

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
   신규 날짜 - 일
========================================================= */

function newDateDayInput(){

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
   신규 소비기한
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
     * 전부 비어있으면 빈 값
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

    const rack =
        document.getElementById(
            "newRackInput"
        )?.value.trim() || "";


    const productName =
        document.getElementById(
            "newProductNameInput"
        )?.value.trim() || "";


    const expiry =
        getNewExpiryDate();


    const quantity =
        cleanNumber(
            document.getElementById(
                "newQuantityInput"
            )?.value
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
     * 소비기한 형식 오류
     */

    if(expiry === null){

        return;
    }


    /*
     * 수량 확인
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
     * 선택한 상품마스터 정보
     */

    const selectedProduct =
        window.selectedNewProduct
        || null;


    /*
     * 화주사
     *
     * 상품을 검색해서 선택한 경우
     * 자동으로 화주사 입력
     */

    let owner = "";


    if(selectedProduct){

        owner =
            String(
                selectedProduct["화주사"]
                || ""
            ).trim();

    }


    /*
     * =====================================================
     * 신규 재고를 inventoryData에 추가
     *
     * 바코드는 신규등록이므로 빈칸
     * =====================================================
     */

    inventoryData.push({

        "바코드":
            selectedProduct
            ?
            selectedProduct["바코드"]
            :
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
     * 현재 랙 유지
     *
     * 신규 재고등록 후
     * 같은 랙에서 계속 조사할 수 있도록
     * 랙을 유지합니다.
     */

    currentRack =
        rack;


    currentProduct = null;


    /*
     * localStorage 저장
     */

    saveLocalData();


    /*
     * 완료 메시지
     */

    alert(
        "신규 재고가 등록되었습니다."
    );


    /*
     * 기존 상품 바코드 조사 화면으로 복귀
     */

    showProductScreen();
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


    showManualCopy(
        shareUrl
    );
}


/* =========================================================
   수동 복사
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById(
            "app"
        );


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


    focusInput(
        "shareUrlInput"
    );
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
   QR
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
        document.getElementById(
            "app"
        );


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

    /*
     * 기존 submit 방식 유지
     *
     * Flask /upload에서
     * new_upload=True로 새 페이지를 렌더링합니다.
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
