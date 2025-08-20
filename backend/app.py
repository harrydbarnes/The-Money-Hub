import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variable to store the path of the last uploaded file
last_uploaded_filepath = None

def analyze_data(df):
    """
    Analyzes the dataframe and returns a dictionary of metrics.
    """
    # Ensure date columns are in datetime format
    if 'query_date' in df.columns:
        df['query_date'] = pd.to_datetime(df['query_date'])
    if 'close_date' in df.columns:
        df['close_date'] = pd.to_datetime(df['close_date'])

    # --- Metrics Calculation ---
    top_supplier_queried_amount = df.groupby('supplier')['amount'].sum().nlargest(5).to_dict() if 'supplier' in df.columns and 'amount' in df.columns else {}
    top_buyer_queried_amount = df.groupby('buyer')['amount'].sum().nlargest(5).to_dict() if 'buyer' in df.columns and 'amount' in df.columns else {}
    top_client_queried_amount = df.groupby('client')['amount'].sum().nlargest(5).to_dict() if 'client' in df.columns and 'amount' in df.columns else {}
    amount_per_year = df.groupby(df['query_date'].dt.year)['amount'].sum().to_dict() if 'query_date' in df.columns and 'amount' in df.columns else {}
    total_with_buyer = df.groupby('buyer')['amount'].sum().to_dict() if 'buyer' in df.columns and 'amount' in df.columns else {}
    with_finance_count = df[df['financed'] == True].shape[0] if 'financed' in df.columns else 0
    total_queries = len(df)
    with_finance = {'count': int(with_finance_count), 'total': total_queries}

    if 'query_date' in df.columns and 'close_date' in df.columns and not df.empty:
        df['ticket_duration'] = (df['close_date'] - df['query_date']).dt.days
        average_ticket_duration = df['ticket_duration'].mean()
    else:
        average_ticket_duration = 0

    if 'buyer' in df.columns and 'ticket_duration' in df.columns and not df.empty:
        best_buyers = df.groupby('buyer')['ticket_duration'].mean().nsmallest(5).to_dict()
    else:
        best_buyers = {}

    if 'buyer' in df.columns and 'close_date' in df.columns and not df.empty:
        most_closed = df.groupby('buyer')['close_date'].count().nlargest(5).to_dict()
    else:
        most_closed = {}

    return {
        'top_supplier_queried_amount': top_supplier_queried_amount,
        'top_buyer_queried_amount': top_buyer_queried_amount,
        'top_client_queried_amount': top_client_queried_amount,
        'amount_per_year': amount_per_year,
        'total_with_buyer': total_with_buyer,
        'with_finance': with_finance,
        'average_ticket_duration': average_ticket_duration,
        'best_buyers_for_quickest_replies': best_buyers,
        'most_closed': most_closed,
    }


@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/upload', methods=['POST'])
def upload_file():
    global last_uploaded_filepath
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        last_uploaded_filepath = filepath

        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(filepath)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400

            # Get the range of years for the slider
            if 'query_date' in df.columns:
                df['query_date'] = pd.to_datetime(df['query_date'])
                years = sorted(df['query_date'].dt.year.unique())
            else:
                years = []

            analysis_results = analyze_data(df)
            analysis_results['years'] = years

            return jsonify(analysis_results)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/filter', methods=['GET'])
def filter_data():
    global last_uploaded_filepath
    if not last_uploaded_filepath:
        return jsonify({'error': 'No file has been uploaded yet.'}), 400

    year = request.args.get('year', type=int)
    if not year:
        return jsonify({'error': 'Year parameter is required.'}), 400

    try:
        if last_uploaded_filepath.endswith('.csv'):
            df = pd.read_csv(last_uploaded_filepath)
        elif last_uploaded_filepath.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(last_uploaded_filepath)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400

        if 'query_date' in df.columns:
            df['query_date'] = pd.to_datetime(df['query_date'])
            df_filtered = df[df['query_date'].dt.year == year]
            analysis_results = analyze_data(df_filtered)
            return jsonify(analysis_results)
        else:
            return jsonify({'error': 'No query_date column found in the file.'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
