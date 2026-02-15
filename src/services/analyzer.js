/**
 * Service to analyze text data from scraped and translated headers.
 */
class AnalyzerService {
    /**
     * Analyzes headers to find words appearing more than twice.
     * @param {string[]} headers - Array of header strings.
     * @returns {Object} - Map of words and their counts.
     */
    analyzeRepeatedWords(headers) {
        if (!Array.isArray(headers) || headers.length === 0) {
            return {};
        }

        const wordCounts = {};

        headers.forEach(header => {
            if (!header) return;

            // Remove punctuation and split by whitespace
            // We use a regex to keep only alphanumeric characters and spaces
            const cleanHeader = header.toLowerCase().replace(/[^\w\s]/g, '');
            const words = cleanHeader.split(/\s+/);

            words.forEach(word => {
                if (word.length > 0) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
            });
        });

        // Filter words appearing more than twice (count > 2)
        const repeatedWords = {};
        for (const [word, count] of Object.entries(wordCounts)) {
            if (count > 1) {
                repeatedWords[word] = count;
            }
        }

        return repeatedWords;
    }

    /**
     * Prints the analysis results in a formatted manner.
     * @param {Object} repeatedWords - Map of words and counts.
     */
    printAnalysisResults(repeatedWords) {
        const entries = Object.entries(repeatedWords);

        console.log("\n--- Header Word Frequency Analysis ---");
        if (entries.length === 0) {
            console.log("No words found appearing more than once.");
        } else {
            console.log("Words appearing more than once across all translated headers:");
            entries.sort((a, b) => b[1] - a[1]); // Sort by frequency
            entries.forEach(([word, count]) => {
                console.log(`- "${word}": ${count} occurrences`);
            });
        }
    }
}

module.exports = new AnalyzerService();
