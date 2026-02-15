require('dotenv').config();
const { By } = require('selenium-webdriver');

const CONFIG = {
    BASE_URL: 'https://elpais.com/',
    OPINION_PATH: '/opinion',
    TIMEOUT_MS: 15000,
    ARTICLE_COUNT: 5,
    IMAGE_DIR: './images',
    LIST_SUBDIR: 'list',
    DETAIL_SUBDIR: 'detail',
    RAPID_API_KEY: process.env.RAPID_API_KEY,
    RAPID_API_HOST: process.env.RAPID_API_HOST || 'rapid-translate-multi-traduction.p.rapidapi.com'
};

const SELECTORS = {
    COOKIE_AGREE_BUTTON: By.id('didomi-notice-agree-button'),
    OPINION_LINK_TEXT: By.linkText('Opinión'),
    OPINION_LINK_PARTIAL: By.partialLinkText('Opinión'),
    OPINION_LINK_XPATH: By.xpath("//a[contains(@href, '/opinion')]"),
    ARTICLE: By.css('article'),
    TITLE_H2: By.css('h2'),
    TITLE_H3: By.css('h3'),
    TITLE_HEADER: By.tagName('header'),
    CONTENT_P: By.css('p'),
    IMAGE: By.css('img'),
    TITLE_LINK: By.css('h2 > a'),
    DETAIL_FIGURE_IMG: By.css('article figure img'),
    DETAIL_MAIN_IMG: By.css('article img')
};

module.exports = {
    CONFIG,
    SELECTORS
};
