/* =========================================================
   재고조사 시스템 script.js
========================================================= */


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

    /*
     * index.html에서 전달받은
     * 상품 마스터 데이터
     */

    mappingData =
        Array.isArray(window.mapping)
            ? window.mapping
            : [];


    /*
     * 이전 작업 데이터 확인
     */

    const saved =
        localStorage.getItem(
            "inventoryData"
        );


    if(saved){

        try{

            const oldData =
                JSON.parse(saved);


            if(
                Array.isArray(oldData) &&
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

                }
                else{

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

        }
        catch(error){

            console.error(
                "저장 데이터 불러오기 실패:",
                error
            );


            localStorage.removeItem(
                "inventoryData"
            );
        }
    }


    /*
     * 업로드 영역 처리
     *
     * uploadBox가 존재하는 경우에만 처리
     */

    const uploadBox =
        document.getElementById(
            "uploadBox"
        );


    if(uploadBox){

        uploadBox.classList.add(
            "hidden"
        );
    }


    /*
     * 상품 마스터가 있으면
     * 바로 랙 스캔 시작
     */

    if(mappingData.length > 0){

        showRackScreen();

        return;
    }


    /*
     * 기존 조사 데이터가 있으면
     * 바로 랙 스캔 시작
     */

    if(inventoryData.length > 0){

        showRackScreen();

        return;
    }


    /*
     * 상품 마스터가 없는 경우
     * 업로드 영역 표시
     */

    if(uploadBox){

        uploadBox.classList.remove(
            "hidden"
        );
    }

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


    const app =
        document.getElementById(
            "app"
        );


    if(!app){

        return;
    }


    app.innerHTML = `

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
     * 랙 바코드 입력칸 자동 포커스
     */

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


    /*
     * 현재 랙 저장
     */

    currentRack =
        rack;


    saveLocalData();


    /*
     * 제품 바코드 화면으로 이동
     */

    showProductScreen();
}


/* =========================================================
   제품 바코드 화면
========================================================= */

function showProductScreen(){

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
   제품 바코드 Enter
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


    /*
     * 상품 마스터에서
     * 바코드 검색
     */

    const product =
        mappingData.find(
            item => {

                const masterBarcode =
                    String(
                        item["바코드"] ?? ""
                    ).trim();


                return (
                    masterBarcode ===
                    barcode
                );

            }
        );


    /*
     * 등록되지 않은 제품
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
     * 현재 제품 정보 저장
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
     * 소비기한 입력 화면
     */

    showQuantityScreen();
}


/* =========================================================
   소비기한 + 박스수 + 낱개수량 화면
========================================================= */

function showQuantityScreen(){

    if(!currentProduct){

        return;
    }


    const product =
        currentProduct;


    const unitQty =
        cleanNumber(
            product["입수량"]
        );


    const app =
        document.getElementById(
            "app"
        );


    if(!app){

        return;
    }


    app.innerHTML = `

        <div class="card">


            <!-- ==========================================
                 현재 랙
            =========================================== -->

            <div class="info-row">

                <span class="info-label">
                    현재 랙:
                </span>

                ${escapeHtml(currentRack)}

            </div>


            <!-- ==========================================
                 바코드
            =========================================== -->

            <div class="info-row">

                <span class="info-label">
                    바코드:
                </span>

                ${escapeHtml(
                    product["바코드"]
                )}

            </div>


            <!-- ==========================================
                 화주사
            =========================================== -->

            <div class="info-row">

                <span class="info-label">
                    화주사:
                </span>

                ${escapeHtml(
                    product["화주사"]
                )}

            </div>


            <!-- ==========================================
                 상품명
            =========================================== -->

            <div class="info-row">

                <span class="info-label">
                    상품명:
                </span>

                ${escapeHtml(
                    product["상품명"]
                )}

            </div>


            <!-- ==========================================
                 입수량
            =========================================== -->

            <div class="info-row">

                <span class="info-label">
                    입수량:
                </span>

                <b>
                    ${unitQty}
                </b>

            </div>


            <!-- ==========================================
                 소비기한
            =========================================== -->

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


            <!-- ==========================================
                 박스수
            =========================================== -->

            <div class="qty-title">
                박스수
            </div>


            <input
                id="boxQty"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="박스수 입력"
                oninput="calculateTotalQty()"
                onkeydown="boxQtyKeyDown(event)"
            >


            <!-- ==========================================
                 낱개수량
            =========================================== -->

            <div class="qty-title">
                낱개수량
            </div>


            <input
                id="eachQty"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="낱개수량 입력"
                oninput="calculateTotalQty()"
                onkeydown="eachQtyKeyDown(event)"
            >


            <!-- ==========================================
                 총 수량
            =========================================== -->

            <div class="qty-title">
                총 수량
            </div>


            <input
                id="totalQty"
                type="text"
                value="0"
                readonly
                style="
                    background:#eeeeee;
                    font-weight:bold;
                "
            >


            <!-- ==========================================
                 계산식
            =========================================== -->

            <div
                id="quantityFormula"
                style="
                    margin-top:10px;
                    padding:12px;
                    background:#f5f5f5;
                    border-radius:8px;
                    text-align:center;
                    font-size:18px;
                    font-weight:bold;
                "
            >
                ${unitQty} × 0 + 0 = 0
            </div>


            <!-- ==========================================
                 저장
            =========================================== -->

            <button
                class="save-qty-btn"
                onclick="saveQuantity()"
            >
                수량 저장
            </button>


            <!-- ==========================================
                 취소
            =========================================== -->

            <button
                onclick="cancelProduct()"
            >
                제품 취소
            </button>


        </div>

    `;


    /*
     * 제품 확인 완료 후
     *
     * ★ 소비기한 년도 자동 포커스
     */

    focusInput(
        "expiryYear"
    );
}


/* =========================================================
   소비기한 년도 입력
========================================================= */

function dateYearInput(){

    const input =
        document.getElementById(
            "expiryYear"
        );


    if(!input){

        return;
    }


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
     * → 월 이동
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
   소비기한 월 입력
========================================================= */

function dateMonthInput(){

    const input =
        document.getElementById(
            "expiryMonth"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 2자리 입력 완료
     * → 일 이동
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
   소비기한 일 입력
========================================================= */

function dateDayInput(){

    const input =
        document.getElementById(
            "expiryDay"
        );


    if(!input){

        return;
    }


    input.value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 2자리 입력 완료
     *
     * → 박스수로 이동
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
            "boxQty"
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
         * 소비기한 완료
         * → 박스수
         */

        focusInput(
            "boxQty"
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
     * 모두 비어있으면 빈 값
     */

    if(
        !year &&
        !month &&
        !day
    ){

        return "";
    }


    /*
     * 자리수 확인
     */

    if(
        year.length !== 4 ||
        month.length !== 2 ||
        day.length !== 2
    ){

        alert(
            "소비기한을 년-월-일 형식으로 입력해주세요."
        );


        return null;
    }


    /*
     * 월 확인
     */

    const monthNumber =
        Number(month);


    if(
        monthNumber < 1 ||
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
     * 일 확인
     */

    const dayNumber =
        Number(day);


    if(
        dayNumber < 1 ||
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
        year +
        "-" +
        month +
        "-" +
        day
    );
}


/* =========================================================
   박스수 입력
========================================================= */

function boxQtyKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    /*
     * 박스수 입력 완료
     * → 낱개수량
     */

    focusInput(
        "eachQty"
    );
}


/* =========================================================
   낱개수량 입력
========================================================= */

function eachQtyKeyDown(event){

    if(event.key !== "Enter"){

        return;
    }


    event.preventDefault();


    /*
     * 낱개수량 Enter
     * → 저장
     */

    saveQuantity();
}


/* =========================================================
   박스수 + 낱개수량 자동 계산
========================================================= */

function calculateTotalQty(){

    if(!currentProduct){

        return;
    }


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    const boxInput =
        document.getElementById(
            "boxQty"
        );


    const eachInput =
        document.getElementById(
            "eachQty"
        );


    const totalInput =
        document.getElementById(
            "totalQty"
        );


    if(
        !boxInput ||
        !eachInput ||
        !totalInput
    ){

        return;
    }


    /*
     * 숫자만 허용
     */

    boxInput.value =
        boxInput.value.replace(
            /[^0-9]/g,
            ""
        );


    eachInput.value =
        eachInput.value.replace(
            /[^0-9]/g,
            ""
        );


    /*
     * 박스수
     */

    const boxQty =
        cleanNumber(
            boxInput.value
        );


    /*
     * 낱개수량
     */

    const eachQty =
        cleanNumber(
            eachInput.value
        );


    /*
     * 총 수량
     *
     * 입수량 × 박스수 + 낱개수량
     */

    const totalQty =
        (unitQty * boxQty)
        + eachQty;


    /*
     * 총 수량 표시
     */

    totalInput.value =
        totalQty;


    /*
     * 계산식 표시
     */

    const formula =
        document.getElementById(
            "quantityFormula"
        );


    if(formula){

        formula.innerText =
            `${unitQty} × ${boxQty} + ${eachQty} = ${totalQty}`;

    }
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
     * 입력칸 가져오기
     */

    const boxInput =
        document.getElementById(
            "boxQty"
        );


    const eachInput =
        document.getElementById(
            "eachQty"
        );


    const totalInput =
        document.getElementById(
            "totalQty"
        );


    if(
        !boxInput ||
        !eachInput ||
        !totalInput
    ){

        return;
    }


    /*
     * 박스수
     */

    const boxQty =
        cleanNumber(
            boxInput.value
        );


    /*
     * 낱개수량
     */

    const eachQty =
        cleanNumber(
            eachInput.value
        );


    /*
     * 입수량
     */

    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    /*
     * 총 수량
     */

    const totalQty =
        (unitQty * boxQty)
        + eachQty;


    /*
     * 총 수량이 0인 경우
     */

    if(totalQty <= 0){

        alert(
            "박스수 또는 낱개수량을 입력해주세요."
        );


        focusInput(
            "boxQty"
        );


        return;
    }


    /*
     * =====================================================
     * 재고조사 데이터 추가
     *
     * 엑셀 시트1
     *
     * A 바코드
     * B 랙
     * C 소비기한
     * D 수량
     * E 상품명
     * F 화주사
     *
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
            totalQty,

        "상품명":
            currentProduct["상품명"],

        "화주사":
            currentProduct["화주사"],

        /*
         * 내부 작업용
         */

        "박스수":
            boxQty,

        "낱개수량":
            eachQty,

        "입수량":
            unitQty

    });


    inventoryCount =
        inventoryData.length;


    /*
     * 로컬 저장
     */

    saveLocalData();


    /*
     * =====================================================
     * ★ 핵심
     *
     * 한 제품 저장 후
     * 현재 랙도 초기화
     *
     * 다시 랙 바코드부터 시작
     * =====================================================
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
   제품 취소
========================================================= */

function cancelProduct(){

    currentProduct = null;


    /*
     * 현재 랙은 유지
     *
     * 제품만 다시 스캔
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
   엑셀 다운로드
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
                    "/download/" +
                    fileId;

            }
        )
        .catch(
            error => {

                console.error(
                    error
                );


                alert(
                    "엑셀 저장에 실패했습니다."
                );

            }
        );
}


/* =========================================================
   엑셀 공유
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
                    location.origin +
                    "/share/" +
                    fileId;


                /*
                 * 모바일 공유
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

                    })
                    .catch(
                        () => {}
                    );


                    return;
                }


                /*
                 * 클립보드
                 */

                if(
                    navigator.clipboard
                ){

                    navigator.clipboard
                        .writeText(
                            url
                        )
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

                console.error(
                    error
                );


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

            method:
                "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify({

                    /*
                     * 실제 조사 데이터
                     */

                    inventory:
                        inventoryData,

                    /*
                     * 상품 마스터
                     *
                     * 시트2 유지용
                     */

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
   공유 링크 수동 복사
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById(
            "app"
        );


    if(!app){

        return;
    }


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


    app.prepend(
        div
    );
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
                    "/qr/" +
                    fileId;


                /*
                 * 기존 QR 제거
                 */

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


                const app =
                    document.getElementById(
                        "app"
                    );


                if(app){

                    app.appendChild(
                        div
                    );
                }

            }
        )
        .catch(
            error => {

                console.error(
                    error
                );


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
   입력칸 포커스
========================================================= */

function focusInput(id){

    setTimeout(
        function(){

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
