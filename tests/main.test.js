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

/*
----------Index Page----------
*/
describe('tests to create an account / login / logout', () => {
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
        dbo = await connection.db("testdb");
        await dbo.collection('users').deleteMany({});
        await connection.close();

    },15000);

    beforeEach(async () => {
        await driver.manage().deleteAllCookies();
        await driver.get(url);
    }, 15000);

    afterAll(async() => {
        await driver.quit();
    }, 15000);


    test('Create an account and check the page we get back has Groupes in its title', async () => {
        await createAccount(driver, 'Xx_Killer_xX', 'Hello123', 'Jacques Dupont', 'jacques.dupont@gmail.com')
        let title = await driver.getTitle();
        let usernameDisplayed = await driver.findElement(By.id('navbardrop')).getAttribute('innerHTML');
        await expect(title).toContain('Groupes');
        await expect(usernameDisplayed).toContain('Xx_Killer_xX');
    });

    test('Create an account with an username that already exist and check the page we get back has Accueil in its title', async () => {
        await createAccount(driver, 'Xx_Killer_xX', 'Hello', 'Pierre Jacques', 'pierro@outlook.com')
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });

    test('Login with correct password and check the page we get back has Groupes in its title', async () => {
        await logIn(driver, 'Xx_Killer_xX', 'Hello123');
        let title = await driver.getTitle();
        let usernameDisplayed = await driver.findElement(By.id('navbardrop')).getAttribute('innerHTML');
        await expect(title).toContain('Groupes');
        await expect(usernameDisplayed).toContain('Xx_Killer_xX');
    });

    test('Login with incorrect password and check the page we get back has Accueil in its title', async () => {
        await logIn(driver, 'Xx_Killer_xX', 'Hello');
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });

    test('Login with incorrect username and check the page we get back has Accueil in its title', async () => {
        await logIn(driver,'Xx_Killer','Hello123');
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });


    // test('Logout when a user is connected and check the page we get back has Accueil in its title')

});

/*
----------Group Page----------
*/
describe('tests to create, join and leave groups', () => {
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
        dbo = await connection.db("testdb");
        await dbo.collection('users').deleteMany({});
        await connection.close();
    },15000);

    beforeEach(async () => {
        await driver.get(url);
    }, 15000);

    afterAll(async() => {
        await driver.quit();
    }, 15000);

    test('Create a group and check the added group id is 1', async () => {
        await driver.findElement(By.id('newTeam')).sendKeys('Groupe n1');
        await driver.findElement(By.id('newpwdTeam')).sendKeys('pwd123456');
        await clickButton(driver, 'submitCreate');
        let groupIcon = await driver.findElement(By.id('1')).getAttribute('innerHTML');
        await expect(groupIcon).toContain('Groupe n1');

        // tester
    });

    test('Create a second group and check the added group id is 2', async () => {
      await driver.findElement(By.id('newTeam')).sendKeys('Groupe n2');
      await driver.findElement(By.id('newpwdTeam')).sendKeys('123pwd');
      await clickButton(driver, 'submitCreate');
      // tester
    });

    test('Join the first group and check the id', async () => {
        await driver.findElement(By.id('teamID')).sendKeys('1');
        await driver.findElement(By.id('pwdTeam')).sendKeys('pwd123456');
        await clickButton(driver, 'submitJoin');
        // tester
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

async function logIn(driver, username, pwd) {
    /**
     * @param {String} username : username of the user
     * @param {String} pwd : pwd of the user
     */
    await driver.findElement(By.id('usernamealready')).sendKeys(username);
    await driver.findElement(By.id('pwdalready')).sendKeys(pwd);
    await clickButton(driver, 'submitLogIn');
}

async function createAccount(driver, username, pwd, name, mail) {
    /**
     * @param {String} username : username of the user
     * @param {String} pwd : password of the user
     * @param {String} name : complete name of the user
     * @param {String} mail : email address of the user
     */
    await driver.findElement(By.id('username')).sendKeys(username);
    await driver.findElement(By.id('pwd')).sendKeys(pwd);
    await driver.findElement(By.id('name')).sendKeys(name);
    await driver.findElement(By.id('mail')).sendKeys(mail);
    await clickButton(driver, 'submitRegister');
}
