const { Builder, By, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const { CONFIG, SELECTORS } = require('../config/constants');
const FileHelper = require('../utils/fileHelper');

class ElPaisScraper {
    constructor(driver = null) {
        this.driver = driver;
    }

    async initializeDriver(externalDriver = null) {
        // Ensure directories exist first
        FileHelper.ensureDirectoryExistence(CONFIG.IMAGE_DIR);
        FileHelper.ensureDirectoryExistence(path.join(CONFIG.IMAGE_DIR, CONFIG.LIST_SUBDIR));
        FileHelper.ensureDirectoryExistence(path.join(CONFIG.IMAGE_DIR, CONFIG.DETAIL_SUBDIR));

        if (externalDriver) {
            this.driver = externalDriver;
            return;
        }
        if (this.driver) return; // Already initialized
        const options = new chrome.Options();
        options.addArguments('--window-size=1150,1080');
        options.addArguments('--window-position=770,0');
        options.addArguments('--disable-notifications');
        options.addArguments('--disable-background-networking');
        options.addArguments('--disable-sync');
        options.addArguments('--log-level=3');
        // options.addArguments('--headless'); // Removed to allow browser window to open

        const prefs = new logging.Preferences();
        prefs.setLevel(logging.Type.BROWSER, logging.Level.SEVERE);
        options.setLoggingPrefs(prefs);

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    }

    async navigateToHome() {
        console.log(`Navigating to ${CONFIG.BASE_URL}...`);
        await this.driver.get(CONFIG.BASE_URL);
    }

    async handleCookies() {
        console.log("Checking for cookie consent...");
        try {
            const button = await this.driver.wait(until.elementLocated(SELECTORS.COOKIE_AGREE_BUTTON), 4000);
            if (await button.isDisplayed()) {
                await button.click();
                await this.driver.sleep(1000);
                console.log("Cookie consent accepted.");
            }
        } catch (error) {
            console.log("No cookie banner found.");
        }
    }

    async navigateToOpinion() {
        console.log("Navigating to Opinion section...");
        try {
            const link = await this.findOpinionLink();
            await this.driver.executeScript("arguments[0].click();", link);
            await this.driver.wait(until.urlContains('opinion'), CONFIG.TIMEOUT_MS);
        } catch (error) {
            console.warn("Navigation fallback used.");
            await this.driver.get(CONFIG.BASE_URL + 'opinion/');
        }
        console.log("Opinion section loaded.");
    }

    async findOpinionLink() {
        const locators = [
            SELECTORS.OPINION_LINK_TEXT,
            By.linkText('OPINIÓN'),
            SELECTORS.OPINION_LINK_PARTIAL,
            SELECTORS.OPINION_LINK_XPATH
        ];
        for (const locator of locators) {
            try {
                return await this.driver.wait(until.elementLocated(locator), 2000);
            } catch (e) { }
        }
        throw new Error("Could not locate Opinion link");
    }

    async scrapeArticles() {
        console.log(`Collecting data for first ${CONFIG.ARTICLE_COUNT} articles from List View...`);

        await this.driver.wait(until.elementLocated(SELECTORS.ARTICLE), CONFIG.TIMEOUT_MS);
        const articles = await this.driver.findElements(SELECTORS.ARTICLE);
        const limit = Math.min(articles.length, CONFIG.ARTICLE_COUNT);

        let scrapedData = [];
        for (let i = 0; i < limit; i++) {
            const article = articles[i];
            const data = await this.extractListViewData(article);
            scrapedData.push(data);
        }

        console.log(`\nCollected list data for ${scrapedData.length} articles. Visiting Detail pages...`);

        for (let i = 0; i < scrapedData.length; i++) {
            const item = scrapedData[i];
            console.log(`Processing Article ${i + 1}/${scrapedData.length}...`);

            if (item.articleUrl) {
                try {
                    await this.driver.get(item.articleUrl);
                    await this.driver.wait(until.elementLocated(By.tagName('body')), 5000);
                    item.detailImageUrl = await this.extractDetailImage();
                } catch (e) {
                    console.error(`Failed to load detail page: ${e.message}`);
                }
            }

            // Download Images
            if (item.listImageUrl) {
                const filename = `article_${i + 1}.jpg`;
                item.listImagePath = path.join(CONFIG.IMAGE_DIR, CONFIG.LIST_SUBDIR, filename);
                await FileHelper.downloadImage(item.listImageUrl, item.listImagePath)
                    .catch(e => console.error(`List img download failed: ${e.message}`));
            }

            if (item.detailImageUrl) {
                const filename = `article_${i + 1}.jpg`;
                item.detailImagePath = path.join(CONFIG.IMAGE_DIR, CONFIG.DETAIL_SUBDIR, filename);
                await FileHelper.downloadImage(item.detailImageUrl, item.detailImagePath)
                    .catch(e => console.error(`Detail img download failed: ${e.message}`));
            }

            this.printArticle(i + 1, item);
        }

        return scrapedData;
    }

    async extractListViewData(articleElement) {
        let title = "Title not found";
        let content = "(No content preview)";
        let listImageUrl = null;
        let articleUrl = null;

        try {
            const h2 = await articleElement.findElement(SELECTORS.TITLE_H2);
            title = await h2.getText();
            const link = await h2.findElement(By.tagName('a'));
            articleUrl = await link.getAttribute('href');
        } catch (e) {
            try {
                const header = await articleElement.findElement(SELECTORS.TITLE_HEADER);
                title = await header.getText();
                const link = await header.findElement(By.tagName('a'));
                articleUrl = await link.getAttribute('href');
            } catch (e2) { }
        }

        try {
            const p = await articleElement.findElement(SELECTORS.CONTENT_P);
            content = await p.getText();
        } catch (e) { }

        try {
            const img = await articleElement.findElement(SELECTORS.IMAGE);
            listImageUrl = await img.getAttribute('src');
            if (!listImageUrl || listImageUrl.startsWith('data:')) {
                const srcset = await img.getAttribute('srcset');
                if (srcset) listImageUrl = srcset.split(',')[0].split(' ')[0];
            }
        } catch (e) { }

        return { title, content, listImageUrl, articleUrl };
    }

    async extractDetailImage() {
        try {
            let img;
            try {
                img = await this.driver.wait(until.elementLocated(SELECTORS.DETAIL_FIGURE_IMG), 2000);
            } catch (e) {
                img = await this.driver.wait(until.elementLocated(SELECTORS.DETAIL_MAIN_IMG), 2000);
            }

            let url = await img.getAttribute('src');

            if (!url || url.startsWith('data:')) {
                const srcset = await img.getAttribute('srcset');
                if (srcset) {
                    const parts = srcset.split(',');
                    const lastPart = parts[parts.length - 1].trim().split(' ')[0];
                    url = lastPart;
                }
            }
            return url;
        } catch (e) {
            return null;
        }
    }

    printArticle(index, data) {
        console.log(`\n--- Article ${index} ---`);
        console.log(`Title: ${data.title}`);
        console.log(`Content: ${data.content}`);
        console.log(`Link: ${data.articleUrl}`);
        console.log(`> List View Image: ${data.listImagePath ? 'Saved' : 'Not available'}`);
        console.log(`> Detail View Image: ${data.detailImagePath ? 'Saved' : 'Not available'}`);
    }

    async close() {
        if (this.driver) await this.driver.quit();
    }
}

module.exports = ElPaisScraper;
