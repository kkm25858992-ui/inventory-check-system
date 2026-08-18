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
