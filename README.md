# Trading212 to Dividend trackers CSV Converter

Converting Trading212 CSV export files into either DIVTracker-compatible or Stock Events-compatible CSV format. It processes your Trading212 transaction data and outputs a compatible CSV file based on your choice of client.


## Prerequisites

Before you can use this script, ensure you have the following installed:

- Node.js: You can download and install Node.js from [nodejs.org](https://nodejs.org/).

## Installation

1. Clone this repository to your local machine:

   ```shell
   git clone https://github.com/thuva4/trading212-to-dividend-trackers.git
   ```

2. Navigate to the project directory:

   ```shell
   cd trading212-to-dividend-trackers
   ```

3. Install the required npm packages:

   ```shell
   yarn
   ```

## Usage

To convert your Trading212 CSV file to either DIVTracker or Stock Events format, follow these steps:

1. Place your Trading212 CSV file in the project directory and name it `input.csv`.

2. Open the `index.js` file and configure the following variables at the bottom of the script:

   - `inputFilePath`: The name of your Trading212 CSV file (e.g., `"input.csv"`).
   - `outputFilePath`: The name of the output CSV file that will be created (e.g., `"output.csv"`).
   - `client`: Specify the client type (`CLIENTS.DIV_TRACKER` or `CLIENTS.STOCK_EVENTS`) based on the type of data you are converting.

3. Save your changes to `index.js`.

4. Run the script using the following command:

   ```shell
   node index.js
   ```

   The script will start processing your CSV file and display progress messages.

5. Once the conversion is complete, you will see a success message and a table displaying the number of trades processed.

6. Your DIVTracker or Stock Events-compatible CSV file will be saved with the name you specified in outputFilePath.

## Customization

You can customize the script to match your specific needs by modifying the `HEADER_FORMAT`, `TICKER_POSTFIX`, and `DATA_PROVIDER` objects in the script. These objects define the column headers, ticker postfixes, and data mapping for each client type.

## Disclaimer

This script is provided as-is and without warranty. It is your responsibility to verify the accuracy of the converted data. Make sure to review the output CSV file and adjust it if necessary before using it with DIVTracker or any other software.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
