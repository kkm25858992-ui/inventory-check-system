from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
import qrcode

from io import BytesIO
from werkzeug.utils import secure_filename


app = Flask(__name__)
app.secret_key = "secret_key_123"


# =========================================================
# 계정
# =========================================================

admins = {
    "김경민": "ourbox123",
}

users = {
    "김경민": "ourbox",
    "8층": "1234",
    "7층": "5678"
}


# =========================================================
# 파일 설정
# =========================================================

UPLOAD_FOLDER = "files"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

FILE_EXPIRE_TIME = 60 * 60


# =========================================================
# 오래된 파일 삭제
# =========================================================

def delete_old_files():

    now = time.time()

    for filename in os.listdir(UPLOAD_FOLDER):

        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        if os.path.isfile(file_path):

            if now - os.path.getmtime(file_path) > FILE_EXPIRE_TIME:

                try:
                    os.remove(file_path)

                except Exception:
                    pass


# =========================================================
# 로그인
# =========================================================

@app.route('/login')
def login_page():

    return render_template(
        'login.html'
    )


@app.route('/login', methods=['POST'])
def login():

    user_id = request.form.get('id')
    pw = request.form.get('pw')
    role = request.form.get('role')


    if role == "admin":

        if (
            user_id in admins
            and admins[user_id] == pw
        ):

            session['login'] = True
            session['role'] = 'admin'

            return redirect('/admin')


    elif role == "user":

        if (
            user_id in users
            and users[user_id] == pw
        ):

            session['login'] = True
            session['role'] = 'user'

            return redirect('/')


    return "로그인 실패"


# =========================================================
# 사용자 페이지
# =========================================================

@app.route('/')
def index():

    if not session.get('login'):

        return redirect('/login')


    if session.get('role') != 'user':

        return redirect('/login')


    return render_template(
        'index.html',
        mapping=[]
    )


# =========================================================
# 관리자
# =========================================================

@app.route('/admin')
def admin():

    if not session.get('login'):

        return redirect('/login')


    if session.get('role') != 'admin':

        return redirect('/login')


    files = []


    for filename in os.listdir(UPLOAD_FOLDER):

        if filename.endswith(".xlsx"):

            file_path = os.path.join(
                UPLOAD_FOLDER,
                filename
            )


            files.append({

                "id": filename.replace(
                    ".xlsx",
                    ""
                ),

                "time": time.strftime(
                    '%Y-%m-%d %H:%M:%S',
                    time.localtime(
                        os.path.getmtime(file_path)
                    )
                )

            })


    files = sorted(
        files,
        key=lambda x: x["time"],
        reverse=True
    )


    return render_template(
        'admin.html',
        files=files
    )


# =========================================================
# 엑셀 업로드
#
# 시트2
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
#
# ★ 수정사항
# 업로드된 파일을 BytesIO로 메모리에 먼저 저장한 후
# ExcelFile / read_excel에서 동일한 데이터를 사용
# =========================================================

@app.route('/upload', methods=['POST'])
def upload():

    try:

        # =================================================
        # 파일 확인
        # =================================================

        if 'file' not in request.files:

            return "파일이 없습니다."


        file = request.files['file']


        if not file or file.filename == "":

            return "파일을 선택해주세요."


        # =================================================
        # 원본 파일명
        #
        # secure_filename()으로 파일명을 먼저 변환하지 않음
        # 한글 파일명도 정상적으로 확장자를 확인하기 위해
        # 원본 파일명에서 확장자를 가져옴
        # =================================================

        original_filename = file.filename.strip()


        # =================================================
        # 확장자 확인
        # =================================================

        _, extension = os.path.splitext(
            original_filename
        )


        extension = extension.lower()


        # =================================================
        # 지원 파일
        # =================================================

        allowed_extensions = {

            ".xlsx",
            ".xlsm",
            ".csv"

        }


        if extension not in allowed_extensions:

            return (
                "지원하지 않는 파일 형식입니다.\n\n"
                "현재 파일 확장자: "
                + (extension if extension else "없음")
                + "\n\n"
                "xlsx, xlsm, csv 파일만 업로드할 수 있습니다."
            )


        # =================================================
        # 파일 전체를 메모리에 읽기
        # =================================================

        file_bytes = file.read()


        if not file_bytes:

            return "업로드된 파일이 비어 있습니다."


        # =================================================
        # CSV
        # =================================================

        if extension == ".csv":

            try:

                mapping_df = pd.read_csv(
                    BytesIO(file_bytes)
                )

            except UnicodeDecodeError:

                try:

                    mapping_df = pd.read_csv(
                        BytesIO(file_bytes),
                        encoding="cp949"
                    )

                except Exception as e:

                    return (
                        "CSV 파일을 읽을 수 없습니다.\n\n"
                        + str(e)
                    )


        # =================================================
        # Excel
        # =================================================

        else:

            try:

                excel = pd.ExcelFile(
                    BytesIO(file_bytes),
                    engine="openpyxl"
                )

            except Exception as e:

                return (
                    "엑셀 파일을 읽을 수 없습니다.\n\n"
                    "파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.\n\n"
                    + str(e)
                )


            # =================================================
            # 시트 확인
            # =================================================

            if len(excel.sheet_names) == 0:

                return "엑셀 파일에 시트가 없습니다."


            # =================================================
            # 기존 기능 유지
            #
            # 시트2가 있으면 시트2
            # 없으면 시트1
            # =================================================

            if len(excel.sheet_names) >= 2:

                target_sheet = excel.sheet_names[1]

            else:

                target_sheet = excel.sheet_names[0]


            # =================================================
            # 선택된 시트 읽기
            # =================================================

            try:

                mapping_df = pd.read_excel(
                    BytesIO(file_bytes),
                    sheet_name=target_sheet,
                    engine="openpyxl"
                )

            except Exception as e:

                return (
                    "엑셀 시트를 읽을 수 없습니다.\n\n"
                    "선택된 시트: "
                    + str(target_sheet)
                    + "\n\n"
                    + str(e)
                )


        # =================================================
        # 데이터 확인
        # =================================================

        if mapping_df is None:

            return "엑셀 데이터를 읽지 못했습니다."


        if mapping_df.empty:

            return "업로드한 엑셀에 데이터가 없습니다."


        # =================================================
        # 컬럼명 정리
        # =================================================

        mapping_df.columns = [

            str(col).strip()

            for col in mapping_df.columns

        ]


        # =================================================
        # 필수 컬럼
        # =================================================

        required_cols = [

            "화주사",
            "바코드",
            "입수량",
            "상품명"

        ]


        missing_cols = [

            col

            for col in required_cols

            if col not in mapping_df.columns

        ]


        if missing_cols:

            return (
                "상품마스터에 다음 컬럼이 없습니다.\n\n"
                + ", ".join(missing_cols)
                + "\n\n"
                "필수 컬럼:\n"
                "화주사, 바코드, 입수량, 상품명"
            )


        # =================================================
        # 화주사
        # =================================================

        mapping_df["화주사"] = (

            mapping_df["화주사"]

            .fillna("")

            .astype(str)

            .str.strip()

        )


        # =================================================
        # 바코드
        # =================================================

        mapping_df["바코드"] = (

            mapping_df["바코드"]

            .fillna("")

            .astype(str)

            .str.strip()

        )


        # =================================================
        # 상품명
        # =================================================

        mapping_df["상품명"] = (

            mapping_df["상품명"]

            .fillna("")

            .astype(str)

            .str.strip()

        )


        # =================================================
        # 입수량
        # =================================================

        mapping_df["입수량"] = (

            mapping_df["입수량"]

            .fillna(0)

            .astype(str)

            .str.replace(
                ",",
                "",
                regex=False
            )

            .str.strip()

        )


        mapping_df["입수량"] = pd.to_numeric(

            mapping_df["입수량"],

            errors="coerce"

        ).fillna(0)


        # =================================================
        # 바코드 없는 행 제거
        # =================================================

        mapping_df = mapping_df[

            mapping_df["바코드"] != ""

        ]


        # =================================================
        # 필요한 컬럼만 사용
        # =================================================

        mapping_df = mapping_df[

            [
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]

        ]


        if mapping_df.empty:

            return (
                "유효한 상품 데이터가 없습니다.\n\n"
                "바코드가 입력된 상품이 있는지 확인해주세요."
            )


        # =================================================
        # 입수량 정리
        # =================================================

        mapping_df["입수량"] = (

            mapping_df["입수량"]

            .apply(

                lambda x:
                int(x)
                if float(x).is_integer()
                else float(x)

            )

        )


        # =================================================
        # JavaScript로 전달
        # =================================================

        mapping = mapping_df.to_dict(
            orient="records"
        )


        # =================================================
        # 업로드 완료
        # =================================================

        return render_template(

            'index.html',

            mapping=mapping

        )


    except Exception as e:

        print(
            "UPLOAD ERROR:",
            repr(e)
        )


        return (
            "엑셀 업로드 오류:\n\n"
            + str(e)
        )

# =========================================================
# 재고조사 저장
#
# 시트1
# A = 바코드
# B = 랙
# C = 소비기한
# D = 수량
# E = 상품명
# F = 화주사
#
# 시트2
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
# =========================================================

@app.route('/save', methods=['POST'])
def save():

    delete_old_files()


    try:

        request_data = request.json


        if not request_data:

            return jsonify({
                "error": "데이터 없음"
            }), 400


        inventory_data = request_data.get(
            "inventory",
            []
        )


        mapping_data = request_data.get(
            "mapping",
            []
        )


        if not inventory_data:

            return jsonify({
                "error": "재고조사 데이터가 없습니다."
            }), 400


        # =================================================
        # 시트1 데이터
        # =================================================

        df_inventory = pd.DataFrame(
            inventory_data
        )


        inventory_columns = [

            "바코드",
            "랙",
            "소비기한",
            "수량",
            "상품명",
            "화주사"

        ]


        # =================================================
        # 없는 컬럼은 빈칸 생성
        # =================================================

        for col in inventory_columns:

            if col not in df_inventory.columns:

                df_inventory[col] = ""


        # =================================================
        # 문자열 처리
        # =================================================

        df_inventory["바코드"] = (

            df_inventory["바코드"]

            .fillna("")

            .astype(str)

        )


        df_inventory["랙"] = (

            df_inventory["랙"]

            .fillna("")

            .astype(str)

        )


        df_inventory["소비기한"] = (

            df_inventory["소비기한"]

            .fillna("")

            .astype(str)

        )


        df_inventory["상품명"] = (

            df_inventory["상품명"]

            .fillna("")

            .astype(str)

        )


        df_inventory["화주사"] = (

            df_inventory["화주사"]

            .fillna("")

            .astype(str)

        )


        # =================================================
        # 수량 숫자 처리
        # =================================================

        df_inventory["수량"] = pd.to_numeric(

            df_inventory["수량"],

            errors="coerce"

        ).fillna(0)


        # =================================================
        # 상품마스터 매칭
        # =================================================

        if mapping_data:

            df_mapping = pd.DataFrame(
                mapping_data
            )


            mapping_columns = [

                "화주사",
                "바코드",
                "입수량",
                "상품명"

            ]


            for col in mapping_columns:

                if col not in df_mapping.columns:

                    df_mapping[col] = ""


            df_mapping = df_mapping[
                mapping_columns
            ]


            df_mapping["바코드"] = (

                df_mapping["바코드"]

                .fillna("")

                .astype(str)

                .str.strip()

            )


            df_mapping["상품명"] = (

                df_mapping["상품명"]

                .fillna("")

                .astype(str)

                .str.strip()

            )


            df_mapping["화주사"] = (

                df_mapping["화주사"]

                .fillna("")

                .astype(str)

                .str.strip()

            )


            # =================================================
            # 바코드 중복 제거
            # =================================================

            df_mapping = df_mapping.drop_duplicates(

                subset=["바코드"],

                keep="first"

            )


            # =================================================
            # 매칭용 데이터
            # =================================================

            mapping_for_merge = df_mapping[

                [
                    "바코드",
                    "상품명",
                    "화주사"
                ]

            ].copy()


            mapping_for_merge = (

                mapping_for_merge

                .rename(

                    columns={

                        "상품명":
                            "매칭상품명",

                        "화주사":
                            "매칭화주사"

                    }

                )

            )


            # =================================================
            # 바코드 기준 매칭
            # =================================================

            df_inventory = df_inventory.merge(

                mapping_for_merge,

                on="바코드",

                how="left"

            )


            # =================================================
            # 상품명
            # =================================================

            df_inventory["상품명"] = (

                df_inventory["상품명"]

                .replace(

                    [
                        "",
                        "nan",
                        "None"
                    ],

                    pd.NA

                )

            )


            df_inventory["상품명"] = (

                df_inventory["상품명"]

                .fillna(
                    df_inventory["매칭상품명"]
                )

                .fillna("")

            )


            # =================================================
            # 화주사
            # =================================================

            df_inventory["화주사"] = (

                df_inventory["화주사"]

                .replace(

                    [
                        "",
                        "nan",
                        "None"
                    ],

                    pd.NA

                )

            )


            df_inventory["화주사"] = (

                df_inventory["화주사"]

                .fillna(
                    df_inventory["매칭화주사"]
                )

                .fillna("")

            )


            # =================================================
            # 임시 컬럼 제거
            # =================================================

            df_inventory.drop(

                columns=[

                    "매칭상품명",
                    "매칭화주사"

                ],

                inplace=True,

                errors="ignore"

            )


        # =================================================
        # 최종 시트1 순서
        # =================================================

        df_inventory = df_inventory[

            [
                "바코드",
                "랙",
                "소비기한",
                "수량",
                "상품명",
                "화주사"
            ]

        ]


        # =================================================
        # 시트2
        # =================================================

        if mapping_data:

            df_mapping = pd.DataFrame(
                mapping_data
            )

        else:

            df_mapping = pd.DataFrame(

                columns=[

                    "화주사",
                    "바코드",
                    "입수량",
                    "상품명"

                ]

            )


        mapping_columns = [

            "화주사",
            "바코드",
            "입수량",
            "상품명"

        ]


        for col in mapping_columns:

            if col not in df_mapping.columns:

                df_mapping[col] = ""


        df_mapping = df_mapping[
            mapping_columns
        ]


        # =================================================
        # 파일 ID
        # =================================================

        file_id = str(
            uuid.uuid4()
        )


        path = os.path.join(

            UPLOAD_FOLDER,

            f"{file_id}.xlsx"

        )


        # =================================================
        # Excel 저장
        # =================================================

        with pd.ExcelWriter(

            path,

            engine="openpyxl"

        ) as writer:


            # -------------------------------
            # 시트1
            # -------------------------------

            df_inventory.to_excel(

                writer,

                index=False,

                sheet_name="시트1"

            )


            # -------------------------------
            # 시트2
            # -------------------------------

            df_mapping.to_excel(

                writer,

                index=False,

                sheet_name="시트2"

            )


        # =================================================
        # 저장 성공
        # =================================================

        return jsonify({

            "file_id": file_id

        })


    except Exception as e:

        print(
            "SAVE ERROR:",
            e
        )


        return jsonify({

            "error": str(e)

        }), 500


# =========================================================
# 다운로드
# =========================================================

@app.route('/download/<file_id>')
def download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="재고조사결과.xlsx",

        as_attachment=True

    )


# =========================================================
# 공유
# =========================================================

@app.route('/share/<file_id>')
def share_download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="재고조사결과.xlsx",

        as_attachment=True

    )


# =========================================================
# QR
# =========================================================

@app.route('/qr/<file_id>')
def generate_qr(file_id):

    url = (

        request.host_url.rstrip("/")

        + "/share/"

        + file_id

    )


    qr = qrcode.make(
        url
    )


    img_io = BytesIO()


    qr.save(
        img_io,
        "PNG"
    )


    img_io.seek(0)


    return send_file(

        img_io,

        mimetype="image/png"

    )


# =========================================================
# 삭제
# =========================================================

@app.route('/delete/<file_id>', methods=['POST'])
def delete_file(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if os.path.exists(path):

        os.remove(path)

        return "삭제 완료"


    return "파일 없음"


# =========================================================
# 실행
# =========================================================

if __name__ == '__main__':

    app.run(
        debug=True
    )
