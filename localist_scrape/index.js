const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const localistUrl = 'https://www.localist.co.nz/discovery';

const scrape = async (query) => {
    try {

        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('headless');

        const driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();

        const url = `${localistUrl}?location_id=auckland&q=${query}`;

        await driver.get(url);

        let promises = [];
        let items = [];
        let elements = await driver.findElements(By.xpath("//*[@class='js-results-map-datum']"));
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            promises.push(getElementData(element));
        }

        items = await Promise.all(promises);    

        await driver.quit();

        return items;
    
    } catch (error) {
        console.log(error);

        return [];
    }
};

const getElementData = async (element) => {
    const data = {
        title: '',
        titleUrl: '',
        imageUrl: '',
        summary: '',
        contactInfo: {
            address: {
                streetAddress: '',
                addressLocality: '',
                postalCode: ''
            },
            telephone: ''
        },
        rating: {
            ratingValue: '',
            ratingCount: '',
            bestRating: '',
            worstRating: ''
        },
        categories: [
            {
                tagName: '',
                tagUrl: ''
            }
        ]
    };

    let promises = [];

    // get Data
    promises.push(addScrapePromise('title', element.findElement(By.css('.listing-summary__title a')).getText()));
    promises.push(addScrapePromise('titleUrl', element.findElement(By.css('.listing-summary__title a')).getAttribute('href')));
    promises.push(addScrapePromise('imageUrl', element.findElement(By.css('.listing-summary__image-container img')).getAttribute('src')));
    promises.push(addScrapePromise('summary', element.findElement(By.css('.listing-summary__body')).getText()));
    promises.push(addScrapePromise('contactInfo', getElementContactInfo(element)));
    promises.push(addScrapePromise('rating', getElementRating(element)));
    promises.push(addScrapePromise('categories', getElementCategories(element)));

    const results = await Promise.all(promises);

    results.forEach(res => {
        data[res.keyName] = res.value;
    });

    return data;
};

const addScrapePromise = async (key, promise) => {
    return {
        keyName: key,
        value: await promise
    };
};

const getElementContactInfo = async (element) => {
    const data = {
        address: {
            streetAddress: '',
            addressLocality: '',
            postalCode: ''
        },
        telephone: ''
    };

    const contactInfoHolders = await element.findElements(By.css('.listing-summary__contact-info .contact-info__item span'));

    for (let i = 0; i < contactInfoHolders.length; i++) {
        const spanElement = contactInfoHolders[i];
        let prop =  spanElement.getAttribute('itemprop');
        let text =  spanElement.getText();

        prop = await prop;
        text = await text;

        if (prop !== 'address') {
            if (['streetAddress', 'addressLocality', 'postalCode'].indexOf(prop) !== -1) {
                data['address'][prop] = text;
            } else {
                data[prop] = text;
            }
        }   
    }
    return data;
};

const getElementRating = async (element) => {
    const data = {
        ratingValue: '',
        ratingCount: '',
        bestRating: '',
        worstRating: ''
    }

    const ratingHolders = await element.findElements(By.css('.star-rating__stars meta'));

    for (let i = 0; i < ratingHolders.length; i++) {
        const ratingElement = ratingHolders[i];
        
        let content =  ratingElement.getAttribute('content');
        let prop =  ratingElement.getAttribute('itemprop');

        content = await content;
        prop = await prop;
        
        if (['ratingValue', 'ratingCount', 'bestRating', 'worstRating'].indexOf(prop) !== -1) {
            data[prop] = content;
        }
    }

    return data;
};

const getElementCategories = async (element) => {
    const data = [];
    const categorieHolders = await element.findElements(By.css('.listing-summary__categories a'));

    for (let i = 0; i < categorieHolders.length; i++) {
        const categorieElement = categorieHolders[i];
        
        let tagName = categorieElement.getText();
        let tagUrl = categorieElement.getAttribute('href');

        tagName = await tagName;
        tagUrl = await tagUrl;

        data.push({tagName, tagUrl});
    }

    return data;
};


module.exports = { scrape }
 