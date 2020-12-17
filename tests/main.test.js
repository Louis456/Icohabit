require('chromedriver');
const { Builder, By, until, Key, Capabilities, Capability } = require('selenium-webdriver');
const script = require('jest');
const { beforeAll } = require('@jest/globals');
const { MongoClient } = require('mongodb');

const url = 'https://localhost:8080';

const capabilities = Capabilities.chrome();
capabilities.set(Capability.ACCEPT_INSECURE_TLS_CERTS, true);
capabilities.setPageLoadStrategy("normal");

jest.setTimeout(30000);

const ACCOUNT_1_USERNAME = 'firstAccount';
const ACCOUNT_1_PASSWORD = 'firstPwd123';
const ACCOUNT_2_USERNAME = 'secondAccount';
const ACCOUNT_2_PASSWORD = 'secondPwd123';

const TEAM_1_NAME = 'Groupe n1';
const TEAM_1_PASSWORD = '123pwd1';
const TEAM_2_NAME = 'Groupe n2';
const TEAM_2_PASSWORD = '123pwd2';


/*
----------Accounts----------
*/
describe('(1) Create an account, login and logout', () => {
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
        driver.manage().window().maximize();
    }, 15000);

    beforeEach(async () => {
        await driver.manage().deleteAllCookies();
        await driver.get(url);
    }, 15000);

    afterAll(async () => {
        await driver.quit();
    }, 15000);


    test('Create an account', async () => {
        await createAccount(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD, 'First Account Name', 'email.1.adress@mail.com');
        let title = await driver.getTitle();
        let usernameDisplayed = await driver.findElement(By.id('navbardrop')).getAttribute('innerHTML');
        await expect(title).toContain('Groupes');
        await expect(usernameDisplayed).toContain(ACCOUNT_1_USERNAME);
    });

    test('Create another account', async () => {
        await createAccount(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, 'Second Account Name', 'email.2.adress@mail.com');
        let title = await driver.getTitle();
        let usernameDisplayed = await driver.findElement(By.id('navbardrop')).getAttribute('innerHTML');
        await expect(title).toContain('Groupes');
        await expect(usernameDisplayed).toContain(ACCOUNT_2_USERNAME);
    });

    test('Create an account with an username that already exist', async () => {
        await createAccount(driver, ACCOUNT_1_USERNAME, 'pwd', 'Pierre Jacques', 'pierro@outlook.com');
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });

    test('Login with correct credentials', async () => {
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        let title = await driver.getTitle();
        let usernameDisplayed = await driver.findElement(By.id('navbardrop')).getAttribute('innerHTML');
        await expect(title).toContain('Groupes');
        await expect(usernameDisplayed).toContain(ACCOUNT_1_USERNAME);
    });

    test('Login with incorrect username', async () => {
        await logIn(driver, 'wrongUsername', ACCOUNT_1_PASSWORD);
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });

    test('Login with incorrect password', async () => {
        await logIn(driver, ACCOUNT_1_USERNAME, 'wrongPassword');
        let title = await driver.getTitle();
        await expect(title).toContain('Accueil');
    });

    test('Logout once logged in', async () => {
        await logIn(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD);
        let title = await driver.getTitle();
        await expect(title).toContain('Groupes');
        await logOut(driver);
        title = await driver.getTitle();
        await expect(title).toContain('Accueil');
        
    });

});

/*
----------Groups----------
*/
describe('(2) Create, join, open and leave groups', () => {
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
        await dbo.collection('groupes').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Create a group with the first account', async () => {
        await driver.get(url);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        await createGroup(driver, TEAM_1_NAME, TEAM_1_PASSWORD);
        let groupIcon = await driver.findElement(By.id('1')).getAttribute('innerHTML');
        await expect(groupIcon).toContain(TEAM_1_NAME);
    });

    test('Create another group with the second account', async () => {
        await logOut(driver);
        await logIn(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD);
        await createGroup(driver, TEAM_2_NAME, TEAM_2_PASSWORD);
        let groupIcon = await driver.findElement(By.id('2')).getAttribute('innerHTML');
        await expect(groupIcon).toContain(TEAM_2_NAME);
    });

    test('Join the first group with the second account', async () => {
        await joinGroup(driver, '1', TEAM_1_PASSWORD);
        let groupIcon_1 = await driver.findElement(By.id('1')).getAttribute('innerHTML');
        let groupIcon_2 = await driver.findElement(By.id('2')).getAttribute('innerHTML');
        await expect(groupIcon_1).toContain(TEAM_1_NAME);
        await expect(groupIcon_2).toContain(TEAM_2_NAME);
    });

    test('Join the second group with the first account', async () => {
        await logOut(driver);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        await joinGroup(driver, '2', TEAM_2_PASSWORD);
        let groupIcon_1 = await driver.findElement(By.id('1')).getAttribute('innerHTML');
        let groupIcon_2 = await driver.findElement(By.id('2')).getAttribute('innerHTML');
        await expect(groupIcon_1).toContain(TEAM_1_NAME);
        await expect(groupIcon_2).toContain(TEAM_2_NAME);
    });

    test('Database: Check if it has been correctly filled', async () => {
        dbo.collection('groupes').findOne({ "_id": 1 }, function (err, group) {
            expect(group.members).toEqual([ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        });
        dbo.collection('groupes').findOne({ "_id": 2 }, function (err, group) {
            expect(group.members).toEqual([ACCOUNT_2_USERNAME, ACCOUNT_1_USERNAME]);
        });
        dbo.collection('users').findOne({ "username": ACCOUNT_1_USERNAME }, function (err, user) {
            expect(user.groupes).toEqual([1, 2]);
        });
        dbo.collection('users').findOne({ "username": ACCOUNT_2_USERNAME }, function (err, user) {
            expect(user.groupes).toEqual([2, 1]);
        });
    });

    test('Click on the first group', async () => {
        await clickButton(driver, '1');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('AppPage');
    });

    test('Click on the second group ', async () => {
        await driver.get(url);
        await clickButton(driver, '2');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_2_NAME);
        await expect(title).toContain('AppPage');
    });

    test('Leave the first group', async () => {
        await driver.get(url);
        await leaveGroup(driver, '1');
        let groupIcons = await driver.findElement(By.id('Teams')).getAttribute('innerHTML');
        await expect(groupIcons).toEqual(expect.not.stringContaining(TEAM_1_NAME));
        await expect(groupIcons).toContain(TEAM_2_NAME);
    });

    test('Leave the second group', async () => {
        await leaveGroup(driver, '2');
        let groupIcons = await driver.findElement(By.id('Teams')).getAttribute('innerHTML');
        await expect(groupIcons).toEqual(expect.not.stringContaining(TEAM_2_NAME));
    });

    test('Database: Check if it has been correctly updated', async () => {
        dbo.collection('groupes').findOne({ "_id": 1 }, function (err, group) {
            expect(group.members).toEqual([ACCOUNT_2_USERNAME]);
        });
        dbo.collection('groupes').findOne({ "_id": 2 }, function (err, group) {
            expect(group.members).toEqual([ACCOUNT_2_USERNAME]);
        });
        dbo.collection('users').findOne({ "username": ACCOUNT_1_USERNAME }, function (err, user) {
            expect(user.groupes).toEqual([]);
        });
    });

});

/*
----------AppPage----------
*/
describe('(3) test AppPage - Click on Planning / Expenses / Todolist', () => {
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
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Click on the Todolist icon', async () => {
        await driver.get(url);
        await logIn(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('TodoList');
    });

    test('Click on the Planning icon', async () => {
        await driver.get(url);
        await clickButton(driver, '1');
        await clickButton(driver, 'PlanningIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Planning');
    });

    test('Click on the Expenses icon', async () => {
        await driver.get(url);
        await clickButton(driver, '1');
        await clickButton(driver, 'ExpensesIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Dépenses');
    });



});

/*
----------TodoList----------
*/
describe('(4) test TodoList - add / delete / check tasks', async () => {
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
        await dbo.collection('todo').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('add a task with the first account in the first group', async() => {
        await driver.get(url);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        //re-joining groupe 1.
        await joinGroup(driver, '1', TEAM_1_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListIcon');
        await addTask(driver,'nettoyer le sol','20122020',[ACCOUNT_1_USERNAME,ACCOUNT_2_USERNAME])
        dbo.collection('todo').find().toArray(function(err, res){
            console.log(res);
        })
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
}

async function logIn(driver, username, pwd) {
    /**
     * @param {String} username : username of the user.
     * @param {String} pwd : password of the user.
     */
    await driver.findElement(By.id('usernamealready')).sendKeys(username);
    await driver.findElement(By.id('pwdalready')).sendKeys(pwd);
    await clickButton(driver, 'submitLogIn');
}

async function createAccount(driver, username, pwd, name, mail) {
    /**
     * @param {String} username : username of the user.
     * @param {String} pwd : password of the user.
     * @param {String} name : complete name of the user.
     * @param {String} mail : email address of the user.
     */
    await driver.findElement(By.id('username')).sendKeys(username);
    await driver.findElement(By.id('pwd')).sendKeys(pwd);
    await driver.findElement(By.id('name')).sendKeys(name);
    await driver.findElement(By.id('mail')).sendKeys(mail);
    await clickButton(driver, 'submitRegister');
}

async function logOut(driver) {
    // Click on the username and then click on 'se déconnecter' to disconnect.
    await clickButton(driver, 'navbardrop');
    await clickButton(driver, 'logout');
}

async function createGroup(driver, name, pwd) {
    /**
     * @param {String} name : name of the group.
     * @param {String} pwd : password of the group.
     */
    await driver.findElement(By.id('newTeam')).sendKeys(name);
    await driver.findElement(By.id('newpwdTeam')).sendKeys(pwd);
    await clickButton(driver, 'submitCreate');
}

async function joinGroup(driver, id, pwd) {
    /**
     * @param {String} id : id of the group.
     * @param {String} pwd : password of the group.
     */
    await driver.findElement(By.id('teamID')).sendKeys(id);
    await driver.findElement(By.id('pwdTeam')).sendKeys(pwd);
    await clickButton(driver, 'submitJoin');
}

async function leaveGroup(driver, id) {
    /**
     * @param {String} id : id of the group.
     */
    await driver.findElement(By.id('teamIDLeave')).sendKeys(id);
    await clickButton(driver, 'submitLeave');
}

async function addTask(driver, task, date, accountants) {
    /**
     * @param {String} task : name of the task
     * @param {String} date : if day = 20, month = 11, year = 2020, date should be in format "20112020"
     * @param {Array} : accountants : list of the accountants.
     * Ex : ['simon','louis','pierre']
     */
    await driver.findElement(By.id('task')).sendKeys(task);
    await driver.findElement(By.id('date')).sendKeys(date);
    await driver.actions().keyDown(Key.CONTROL).perform();
    for (accountant of accountants) {
        await driver.findElement(By.id(accountant)).click();
    }
    await driver.actions().keyUp(Key.CONTROL).perform();
    await clickButton(driver,'submitTask')
}

