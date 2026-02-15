# Browserstack Assignment

### Table of Contents
- [Local Testing Video](#local-testing-video)
- [Browserstack Testing Video](#browserstack-testing-video)
- [Testing Details](#testing-details)
- [Devices on which Automation is Tested](#devices-on-which-automation-is-tested)
- [Process](#process)

## Local Testing Video:
[![Watch the video](https://img.youtube.com/vi/Qss28ZD2Z5s/0.jpg)](https://www.youtube.com/watch?v=Qss28ZD2Z5s)

## Browserstack Testing Video:
[![Watch the video](https://img.youtube.com/vi/ebMG7ty_cdQ/0.jpg)](https://www.youtube.com/watch?v=ebMG7ty_cdQ)

## Testing Details:

- Scraped articles - [Scraped Articles](scraped_articles.json)
- Headers and its content - [Original Headers](headers_original.txt)
- Translated Headers - [Translated Headers](headers_translated.txt)
- Word count analysis - [Word Count Analysis](word_count_analysis.txt)
- Local log - [Local Log](local.log)
- Performance report of 5 parallel threads - [Performance Report](log/performance-report/performance-report-34880-0.json)

## Devices on which Automation is Tested:

### 🖥 Desktop Browsers

* **Windows 11** → Chrome (Latest)
* **macOS Sonoma** → Safari (Latest)
* **Windows 10** → Microsoft Edge (Latest)

### 📱 Mobile Devices

* **iPhone 15 (iOS 17)** → Safari
* **Google Pixel 8 (Android 14)** → Chrome

## Process:
1. Visit [ESPN](https://www.espn.com/)
2. Scrape top 5 articles from the /opinion page
3. Print and save its headers and content into a JSON file
4. Translate the headers using https://rapidapi.com
5. Save the original and translated headers to respective text files
6. Identify any words appearing more than twice across all headers combined
7. Print the repeated word along with the count of its occurrences and store them in analysis file.