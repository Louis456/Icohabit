require('chromedriver');
const {Builder,By,Key,Until} = require('selenium-webdriver');
const script = require('jest');
const { beforeAll } = require('@jest/globals');
const { MongoClient } = require('mongodb');

const url = 'https://localhost:8080';

describe('tests to create an account / login', () => {
    let driver = new Builder().forBrowser("chrome").build();
    let dbo;

    beforeAll(async () => {
        connection = await MongoClient.connect('mongodb://localhost:27017', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        dbo = await connection.db("database");
        await dbo.collection('users').drop();
    },15000);

    beforeEach(async () => {
        driver.manage().deleteAllCookies();
        bypassCertAuthorityInvalid()
    }, 5000);

    afterAll(async() => {
        await connection.close();
        await db.close();
        await driver.quit();
    }, 15000);

    test('Create an account and check the page we get back has Groupes in its title', async () => {
        await driver.get(url);
        await driver.findElement(By.id('username')).sendKeys('Xx_Killer_xX');
        await driver.findElement(By.id('pwd')).sendKeys('Hello123');
        await driver.findElement(By.id('name')).sendKeys('Jacques Dupont');
        await driver.findElement(By.id('mail')).sendKeys('Jacques.Dupont@gmail.com');
        await driver.findElement(By.id('submitLogIn')).click();
        let title = await driver.getTitle();
        expect(title).toContain('Groupes');
    });

    test('Login with correct password and check the page we get back has Groupes in its title', async () => {
        await driver.get(url);
        await driver.findElement(By.id('usernamealready')).sendKeys('Xx_Killer_xX');
        await driver.findElement(By.id('pwdalready')).sendKeys('Hello123');
        await driver.findElement(By.id('submitRegister')).click();
        let title = await driver.getTitle();
        expect(title).toContain('Groupes');
    });

});


async function bypassCertAuthorityInvalid(){
    /**
     * Use this to bypass the chrome NET::ERR_CERT_AUTHORITY_INVALID
     */
    await driver.findElement(By.id('details-button')).click();
    await driver.findElement(By.id('proceed-link')).click();
}
