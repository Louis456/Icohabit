require('chromedriver');
const { Builder, By, until, Key, Capabilities, Capability} = require('selenium-webdriver');
const script = require('jest');
const { beforeAll } = require('@jest/globals');
const { MongoClient } = require('mongodb');

const url = 'https://localhost:8080';

const capabilities = Capabilities.chrome();
capabilities.set(Capability.ACCEPT_INSECURE_TLS_CERTS, true);
capabilities.setPageLoadStrategy("normal");

jest.setTimeout(30000);

describe('tests to create an account / login', () => {
    let driver;
    let dbo;
    

    beforeAll(async () => {
        driver = new Builder()
                .withCapabilities(capabilities)
                .forBrowser('chrome')
                .build();
        connection = await MongoClient.connect('mongodb://localhost:27017', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        dbo = await connection.db("database");
        await dbo.collection('users').drop();
    },15000);

    beforeEach(async () => {
        driver.manage().deleteAllCookies();
        await driver.manage().window().maximize();
        await driver.get(url);
    }, 15000);

    afterAll(async() => {
        await connection.close();
        await db.close();
        await driver.quit();
    }, 15000);

    test('Create an account and check the page we get back has Groupes in its title', async () => {
        await driver.findElement(By.id('username')).sendKeys('Xx_Killer_xX');
        await driver.findElement(By.id('pwd')).sendKeys('Hello123');
        await driver.findElement(By.id('name')).sendKeys('Jacques Dupont');
        await driver.findElement(By.id('mail')).sendKeys('Jacques.Dupont@gmail.com');
        await clickButton(driver, 'submitRegister');
        let title = await driver.getTitle();
        expect(title).toContain('Groupes');
    });
    
    test('Login with correct password and check the page we get back has Groupes in its title', async () => {
        await driver.findElement(By.id('usernamealready')).sendKeys('Xx_Killer_xX');
        await driver.findElement(By.id('pwdalready')).sendKeys('Hello123');
        await clickButton(driver, 'submitLogIn');
        let title = await driver.getTitle();
        expect(title).toContain('Groupes');
    });
    

});


async function clickButton(driver, id) {
    /**
     * Workaround to click a button with selenium.
     * @param {String} id : The id of the button.
     */
    await driver.wait(until.elementLocated(By.id(id)), 10000);
    let button = await driver.findElement(By.id(id));
    await driver.wait(until.elementIsEnabled(button, 15000));
    await driver.executeScript("arguments[0].click();", button);
    return;
}
