const ElPaisScraper = require('./src/services/scraper');
const translator = require('./src/services/translator');
const analyzer = require('./src/services/analyzer');
const FileHelper = require('./src/utils/fileHelper');
const fs = require('fs');

async function main() {
    console.log("Starting El País Scraper (Production Mode)...");
    const scraper = new ElPaisScraper();

    try {
        // Step 1: Initialize and Scrape
        await scraper.initializeDriver();
        await scraper.navigateToHome();
        await scraper.handleCookies();
        await scraper.navigateToOpinion();

        const articles = await scraper.scrapeArticles();

        // Step 2: Save metadata
        FileHelper.saveToFile('scraped_articles.json', JSON.stringify(articles, null, 2));
        console.log("\n[SUCCESS] Scraped data saved to scraped_articles.json");

        // Step 3: Analyze and Translate Headers
        const headers = articles.map(a => a.title);
        console.log("\nProcessing Translation...");

        // Save original headers for diff
        FileHelper.saveToFile('headers_original.txt', headers.join('\n'));
        console.log("Original headers saved to headers_original.txt");

        try {
            const translated = await translator.translateHeaders(headers);

            console.log("\n--- Translation Results ---");
            if (Array.isArray(translated)) {
                translated.forEach((t, i) => console.log(`${i + 1}. ${t}`));
                FileHelper.saveToFile('headers_translated.txt', translated.join('\n'));
                console.log("\nTranslated headers saved to headers_translated.txt");

                // Step 4: Analyze translated headers
                const repeatedWords = analyzer.analyzeRepeatedWords(translated);
                analyzer.printAnalysisResults(repeatedWords);

                // Save analysis to a file for debugging/production records
                const analysisContent = Object.entries(repeatedWords)
                    .sort((a, b) => b[1] - a[1])
                    .map(([word, count]) => `"${word}": ${count}`)
                    .join('\n');
                FileHelper.saveToFile('word_count_analysis.txt', analysisContent || 'No words appeared more than once.');
                console.log("Analysis results saved to word_count_analysis.txt");
            } else {
                console.log("Note: API response format was not an array. Saving raw response.");
                FileHelper.saveToFile('headers_translated_raw.json', JSON.stringify(translated, null, 2));
            }
        } catch (transError) {
            console.error("\n[ERROR] Translation step failed:", transError.message);
        }

    } catch (error) {
        console.error("\n[CRITICAL ERROR] Execution failed:", error.stack);
    } finally {
        await scraper.close();
        console.log("\nScraper closed. Task complete.");
    }
}

main();