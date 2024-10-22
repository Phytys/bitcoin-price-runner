#utils.py
import pandas as pd
import numpy as np
from pycoingecko import CoinGeckoAPI
import time
import logging
import random

logger = logging.getLogger(__name__)

def get_historical_bitcoin_data():
    """Load historical Bitcoin price data from a CSV file."""
    df = pd.read_csv('bitcoin_historical.csv', delimiter=";")

    # Convert 'Start' column to datetime
    df['Start'] = pd.to_datetime(df['Start'])

    # Ensure the data is sorted by date
    df = df.sort_values('Start')

    # Rename the 'Close' column to 'price' for clarity
    df.rename(columns={'Close': 'price'}, inplace=True)

    return df

def get_last_year_bitcoin_data():
    """Fetch the last year's Bitcoin price data from CoinGecko and return it as a DataFrame."""
    cg = CoinGeckoAPI()
    
    # Fetch the data (timestamps are in UNIX format, and prices are in USD)
    bitcoin_data = cg.get_coin_market_chart_by_id(id='bitcoin', vs_currency='usd', days=365)

    # Prepare the data into a DataFrame
    prices = bitcoin_data['prices']
    
    df_last_year = pd.DataFrame(prices, columns=['date_unix', 'price'])

    # Convert the UNIX timestamp to a date
    df_last_year['date'] = pd.to_datetime(df_last_year['date_unix'], unit='ms')
    
    return df_last_year

def complete_bitcoin_data(ma=7):
    """Merge historical data from CSV with the last year's data from CoinGecko and calculate a moving average."""
    try:
        logger.info("Starting to complete Bitcoin data")
        
        # Load historical data from CSV
        df_historical = get_historical_bitcoin_data()

        # Get last year's data from CoinGecko
        df_last_year = get_last_year_bitcoin_data()

        # Convert the 'Start' column to 'date' in historical data
        df_historical['date'] = df_historical['Start']

        # Merge the data on the 'date' column
        df_merged = pd.concat([df_historical[['date', 'price']], df_last_year[['date', 'price']]], ignore_index=True)

        # Ensure no duplicates (if there's overlap between historical and last year's data)
        df_merged = df_merged.drop_duplicates(subset='date', keep='last').sort_values('date')

        # Add 'date_unix' column based on the 'date' column
        df_merged['date_unix'] = df_merged['date'].apply(lambda x: int(time.mktime(x.timetuple()) * 1000))

        # Calculate moving average and add it to the DataFrame
        ma_column = f"ma_{ma}"
        df_merged[ma_column] = df_merged['price'].rolling(window=ma).mean()

        # Remove rows where moving average is NaN
        df_merged = df_merged.dropna(subset=[ma_column])

        logger.info("Bitcoin data completed successfully")
        return df_merged
    except Exception as e:
        logger.error(f"Error in complete_bitcoin_data: {str(e)}")
        raise


def obstacles_drawdowns_weekly(drawdown_percentage):
    """ 
    Returns dataframe with columns: ['local_top_price', 'local_top_date', 'drawdown_price',
        'drawdown_date_unix', 'drawdown_date', 'drawdown']
    """
    df=complete_bitcoin_data()
    # Resample to weekly data
    df.set_index('date', inplace=True)
    df_weekly = df.resample('W').last().reset_index()
    
    # Ensure there are no NaN values in the 'ma_7' column
    df_weekly = df_weekly.dropna(subset=['ma_7'])
    
    # Identify local tops using ma_7
    df_weekly['local_top'] = (df_weekly['ma_7'] > df_weekly['ma_7'].shift(1)) & (df_weekly['ma_7'] > df_weekly['ma_7'].shift(-1))
    df_weekly['local_top'] = df_weekly['local_top'].astype(bool)

    # Calculate drawdowns
    drawdowns = []
    for i in range(len(df_weekly)):
        if df_weekly.loc[i, 'local_top']:
            local_top_price = df_weekly.loc[i, 'ma_7']
            for j in range(i+1, len(df_weekly)):
                drawdown = (local_top_price - df_weekly.loc[j, 'ma_7']) / local_top_price
                if drawdown >= drawdown_percentage:
                    drawdowns.append({
                        'local_top_date': df_weekly.loc[i, 'date'],
                        'local_top_price': local_top_price,
                        'drawdown_date': df_weekly.loc[j, 'date'],
                        'drawdown_date_unix': df_weekly.loc[j, 'date_unix'],
                        'drawdown_price': df_weekly.loc[j, 'ma_7'],
                        'drawdown': drawdown
                    })
                    break

    return pd.DataFrame(drawdowns)

def get_bitcoin_events():
    """Load Bitcoin events from a CSV file, convert date to datetime, and add date_unix.
    Return data frame with columns: ['date', 'event', 'impact', 'date_unix']
    """
    # Load the CSV file (with ";" as the delimiter)
    df = pd.read_csv('bitcoin_events.csv', delimiter=";")
    
    # Convert the 'date' column to datetime format
    df['date'] = pd.to_datetime(df['date'])
    
    # Create 'date_unix' column by converting the 'date' column to UNIX timestamp
    df['date_unix'] = df['date'].apply(lambda x: int(time.mktime(x.timetuple()) * 1000))

    return df

def get_random_bitcoin_data(df=None, n=60):
    """
    Select n random rows from the complete Bitcoin data.
    
    Parameters:
    df (pd.DataFrame): The complete Bitcoin data. If None, it will be fetched using complete_bitcoin_data().
    n (int): Number of random rows to select. Default is 60.
    
    Returns:
    pd.DataFrame: A DataFrame containing n randomly selected rows from the input data.
    """
    try:
        logger.info(f"Selecting {n} random rows from Bitcoin data")
        
        # If df is not provided, fetch the complete Bitcoin data
        if df is None:
            df = complete_bitcoin_data()
        
        # Ensure n is not larger than the number of rows in the DataFrame
        n = min(n, len(df))
        
        # Randomly select n rows
        random_rows = df.sample(n=n)
        
        logger.info(f"Successfully selected {n} random rows")
        return random_rows  # Here is the return statement
    
    except Exception as e:
        logger.error(f"Error in get_random_bitcoin_data: {str(e)}")
        raise
