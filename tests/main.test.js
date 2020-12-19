require('chromedriver');
const { Builder, By, until, Key, Capabilities, Capability } = require('selenium-webdriver');
const script = require('jest');
const { beforeAll } = require('@jest/globals');
const { MongoClient } = require('mongodb');

const capabilities = Capabilities.chrome();
capabilities.set(Capability.ACCEPT_INSECURE_TLS_CERTS, true);
capabilities.setPageLoadStrategy("normal");


jest.setTimeout(30000);

// IMPORTANT !! Choose your browser language before starting tests (en, fr, nl) !!
const BROWSER_LANGUAGE = "en"

const URL = 'https://localhost:8080';
const DATABASE = "testdb"

const ACCOUNT_1_USERNAME = 'firstAccount';
const ACCOUNT_1_PASSWORD = 'firstPwd123';
const ACCOUNT_2_USERNAME = 'secondAccount';
const ACCOUNT_2_PASSWORD = 'secondPwd123';

const TEAM_1_NAME = 'Groupe n1';
const TEAM_1_PASSWORD = '123pwd1';
const TEAM_2_NAME = 'Groupe n2';
const TEAM_2_PASSWORD = '123pwd2';
const TEAM_3_NAME = 'groupRocknRoll'
const TEAM_3_PASSWORD = '123pwd3';
const TEAM_4_NAME = 'BlueJacket'
const TEAM_4_PASSWORD = '123pwd4';
const TEAM_5_NAME = 'TeamRocket'
const TEAM_5_PASSWORD = '123pwd5';
const TEAM_6_NAME = 'HomeSweetHome'
const TEAM_6_PASSWORD = '123pwd6';

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
        dbo = await connection.db(DATABASE);
        await dbo.collection('users').deleteMany({});
        await connection.close();
        driver.manage().window().maximize();
    }, 15000);

    beforeEach(async () => {
        await driver.manage().deleteAllCookies();
        await driver.get(URL);
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
        dbo = await connection.db(DATABASE);
        await dbo.collection('groupes').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Create a group with the first account', async () => {
        await driver.get(URL);
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
        await driver.get(URL);
        await clickButton(driver, '2');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_2_NAME);
        await expect(title).toContain('AppPage');
    });

    test('Leave the first group', async () => {
        await driver.get(URL);
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
describe('(3) Click on Todolist, Planning, Expenses', () => {
    let driver;
    beforeAll(async () => {
        driver = new Builder()
            .withCapabilities(capabilities)
            .forBrowser('chrome')
            .build();
        await driver.manage().deleteAllCookies();
        await driver.manage().window().maximize();
    }, 15000);

    beforeEach(async () => {
        await driver.get(URL);
    }, 15000);

    afterAll(async () => {
        await driver.quit();
    }, 15000);

    test('Click on the Todolist icon', async () => {
        await logIn(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('TodoList');
    });

    test('Click on the Planning icon', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, 'PlanningIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Planning');
    });

    test('Click on the Expenses icon', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, 'ExpensesIcon');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Dépenses');
    });

    test('Click on the Todolist navbar button', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListButtton');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('TodoList');
    });

    test('Click on the Planning navbar button', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, 'PlanningButtton');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Planning');
    });

    test('Click on the Expenses navbar button', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, 'ExpensesButtton');
        let title = await driver.getTitle();
        await expect(title).toContain(TEAM_1_NAME);
        await expect(title).toContain('Dépenses');
    });

    test('Click on the Expenses navbar button', async () => {
        await clickButton(driver, '1');
        await clickButton(driver, "getBackToGroups");
        let title = await driver.getTitle();
        await expect(title).toContain('Groupes');
    });



});

/*
----------TodoList----------
*/
describe('(4) Add, Delete and Check tasks in the todolist', () => {
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
        dbo = await connection.db(DATABASE);
        await dbo.collection('todo').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Add a task with the first account in the first group', async () => {
        await driver.get(URL);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        //re-joining groupe 1.
        await joinGroup(driver, '1', TEAM_1_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListIcon');
        await addTask(driver, 'nettoyer le sol', '20122020', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await verifyTask(dbo, '1', 0, 'nettoyer le sol', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME], '20122020', false);
    });

    test('Add another task with the second account in the first group', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'TodoListIcon');
        await addTask(driver, 'cuire les saucisses', '25122020', [ACCOUNT_1_USERNAME]);
        await verifyTask(dbo, '1', 1, 'cuire les saucisses', [ACCOUNT_1_USERNAME], '25122020', false);
    });

    test('Second account sees both tasks', async() => {
        verifyContainingOrNot(driver, 'todo 0', ['nettoyer le sol',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME], []);
        verifyContainingOrNot(driver, 'todo 1', ['cuire les saucisses',ACCOUNT_1_USERNAME], []);
    });

    test('First account sees both tasks', async() => {
        await switchAccountAndGetToApp(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD, '1', 'TodoListIcon');
        verifyContainingOrNot(driver, 'todo 0', ['nettoyer le sol',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME], []);
        verifyContainingOrNot(driver, 'todo 1', ['cuire les saucisses',ACCOUNT_1_USERNAME], []);
    });

    test('Check the first task', async () => {
        await clickButton(driver, 'donebtn 0');
        dbo.collection('todo').findOne({ "groupe": '1' }, function (err, todoOfTheGroup) {
            let addedTask = todoOfTheGroup.tasks[0];
            expect(addedTask["done"]).toEqual(true);
        });
    });

    test('Delete the first task that has been checked', async () => {
        await clickButton(driver, 'deletebtn 0');
        dbo.collection('todo').findOne({ "groupe": '1' }, function (err, todoOfTheGroup) {
            expect(todoOfTheGroup.tasks[0]['_id']).not.toEqual(0);
        });
    });

    test('Delete the second task that hasnt been checked', async () => {
        await clickButton(driver, 'deletebtn 1');
        dbo.collection('todo').findOne({ "groupe": '1' }, function (err, todoOfTheGroup) {
            expect(todoOfTheGroup.tasks).toEqual([]);
        });
    });

    test('First account sees no task', async () => {
        await verifyContainingOrNot(driver,'todo', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'nettoyer le sol', 'cuire les saucisses']);
        await verifyContainingOrNot(driver, 'done', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'nettoyer le sol', 'cuire les saucisses']);
    });

    test('Second account sees no task', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'TodoListIcon');
        await verifyContainingOrNot(driver,'todo', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'nettoyer le sol', 'cuire les saucisses']);
        await verifyContainingOrNot(driver, 'done', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'nettoyer le sol', 'cuire les saucisses']);
    });

});


/*
----------Planning----------
*/
describe('(5) Add and Delete events in the planning', () => {
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
        dbo = await connection.db(DATABASE);
        await dbo.collection('planning').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Add an event to come with the first account in the first group', async () => {
        await driver.get(URL);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'PlanningIcon');
        await addEvent(driver, 'soirée pyjama au kot', '15022021', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await verifyEvent(dbo, '1', 0, 'soirée pyjama au kot', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME], '15022021');
    });

    test('Add an already past event with the second account in the first group', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'PlanningIcon');
        await addEvent(driver, 'apocalypse de zombies', '05122020', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await verifyEvent(dbo, '1', 1, 'apocalypse de zombies', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME], '05122020');
    });

    test('Second account sees both events', async() => {
        await verifyContainingOrNot(driver, 'tocome 0', ['soirée pyjama au kot',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME], []);
        await verifyContainingOrNot(driver, 'past 1', ['apocalypse de zombies',ACCOUNT_1_USERNAME], []);
    });

    test('First account sees both events', async() => {
        await switchAccountAndGetToApp(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD, '1', 'PlanningIcon');
        await verifyContainingOrNot(driver, 'tocome 0', ['soirée pyjama au kot',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME], []);
        await verifyContainingOrNot(driver, 'past 1', ['apocalypse de zombies',ACCOUNT_1_USERNAME], []);
    });

    test('Delete the first event that was a future event', async () => {
        await clickButton(driver, 'deletebtn 0');
        dbo.collection('planning').findOne({ "groupe": '1' }, function (err, planningOfTheGroup) {
            expect(planningOfTheGroup.events[0]['_id']).not.toEqual(0);
        });
    });

    test('Delete the second event that was a past event', async () => {
        await clickButton(driver, 'deletebtn 1');
        dbo.collection('planning').findOne({ "groupe": '1' }, function (err, planningOfTheGroup) {
            expect(planningOfTheGroup.events).toEqual([]);
        });
    });

    test('First account sees no event', async () => {
        await verifyContainingOrNot(driver, 'tocome',[], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'soirée pyjama au kot', 'apocalypse de zombies']);
        await verifyContainingOrNot(driver,'past', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'soirée pyjama au kot', 'apocalypse de zombies']);

    });

    test('Second account sees no event', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'PlanningIcon');
        await verifyContainingOrNot(driver, 'tocome',[], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'soirée pyjama au kot', 'apocalypse de zombies']);
        await verifyContainingOrNot(driver,'past', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'soirée pyjama au kot', 'apocalypse de zombies']);

    });


});


/*
----------Expenses----------
*/
describe('(6) Add and Delete expenses in the Dépenses', () => {
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
        dbo = await connection.db(DATABASE);
        await dbo.collection('expenses').deleteMany({});
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('Add an expense with the first account in the first group', async () => {
        await driver.get(URL);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'ExpensesIcon');
        await addExpense(driver, 'jupilers et chipolatas', '24122020', 27, ACCOUNT_1_USERNAME, [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await verifyExpense(dbo, '1', 0, 'jupilers et chipolatas', '24122020', 27, ACCOUNT_1_USERNAME, [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await verifyExpensesSolver(dbo, '1', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME], ['+13.5', '-13.5'], [ACCOUNT_2_USERNAME], [ACCOUNT_1_USERNAME], [13.5]);
    });

    test('Add another expense with the second account in the first group', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'ExpensesIcon');
        await addExpense(driver, 'guirlandes et boules chromées', '20122020', 32.6, ACCOUNT_2_USERNAME, [ACCOUNT_1_USERNAME]);
        await verifyExpense(dbo, '1', 1, 'guirlandes et boules chromées', '20122020', 32.6, ACCOUNT_2_USERNAME, [ACCOUNT_1_USERNAME]);
        await verifyExpensesSolver(dbo, '1', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME], ['-19.1', '+19.1'], [ACCOUNT_1_USERNAME], [ACCOUNT_2_USERNAME], [19.1]);
    });

    test('Second account sees both expenses and the result of the solver', async() => {
        await verifyContainingOrNot(driver, 'expense 0', ['jupilers et chipolatas',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME, '27'], ['guirlandes et boules chromées']);
        await verifyContainingOrNot(driver, 'expense 1', ['guirlandes et boules chromées',ACCOUNT_1_USERNAME, '32.6'], ['jupilers et chipolatas']);
        await verifyContainingOrNot(driver, 'accounts', [ACCOUNT_2_USERNAME, ACCOUNT_1_USERNAME, '+19.1', '-19.1'], []);
        await verifyContainingOrNot(driver, 'transactions', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, '19.1'], ['13.5']);
    });

    test('First account sees both expenses and the result of the solver', async() => {
        await switchAccountAndGetToApp(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD, '1', 'ExpensesIcon');
        await verifyContainingOrNot(driver, 'expense 0', ['jupilers et chipolatas',ACCOUNT_2_USERNAME+','+ACCOUNT_1_USERNAME, '27'], ['guirlandes et boules chromées']);
        await verifyContainingOrNot(driver, 'expense 1', ['guirlandes et boules chromées',ACCOUNT_1_USERNAME, '32.6'], ['jupilers et chipolatas']);
        await verifyContainingOrNot(driver, 'accounts', [ACCOUNT_2_USERNAME, ACCOUNT_1_USERNAME, '+19.1', '-19.1'], []);
        await verifyContainingOrNot(driver, 'transactions', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, '19.1'], ['13.5']);
    });

    test('Delete the first expense', async () => {
        await clickButton(driver, 'deletebtn 0');
        dbo.collection('expenses').findOne({ "groupe": '1' }, function (err, expensesOfTheGroup) {
            expect(expensesOfTheGroup.expensesArray[0]['_id']).not.toEqual(0);
        });
    });

    test('Verify the new result of the solver', async () => {
        await verifyExpensesSolver(dbo, '1', [ACCOUNT_2_USERNAME, ACCOUNT_1_USERNAME], ['+32.6', '-32.6'], [ACCOUNT_1_USERNAME], [ACCOUNT_2_USERNAME], [32.6]);
    });

    test('Delete the second expense', async () => {
        await clickButton(driver, 'deletebtn 1');
        dbo.collection('expenses').findOne({ "groupe": '1' }, function (err, expensesOfTheGroup) {
            expect(expensesOfTheGroup.expensesArray).toEqual([]);
        });
    });

    test('First account sees no expense and no result of the solver', async () => {
        await verifyContainingOrNot(driver, 'expenses',[], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);
        await verifyContainingOrNot(driver,'accounts', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);
        await verifyContainingOrNot(driver,'transactions', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);

    });

    test('Second account sees no expense and no result of the solver', async () => {
        await switchAccountAndGetToApp(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD, '1', 'ExpensesIcon');
        await verifyContainingOrNot(driver, 'expenses',[], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);
        await verifyContainingOrNot(driver,'accounts', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);
        await verifyContainingOrNot(driver,'transactions', [], [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME, 'jupilers', 'guirlandes', '13.5', '19.1']);

    });


});

describe('(7) Search in groups', () => {
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
        dbo = await connection.db(DATABASE);
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('research for group(s) with inexact search text', async () => {
        await driver.get(URL);
        await logIn(driver, ACCOUNT_2_USERNAME, ACCOUNT_2_PASSWORD);
        await createGroup(driver,TEAM_3_NAME,TEAM_3_PASSWORD);
        await createGroup(driver,TEAM_4_NAME,TEAM_4_PASSWORD);
        await createGroup(driver,TEAM_5_NAME,TEAM_5_PASSWORD);
        await createGroup(driver,TEAM_6_NAME,TEAM_6_PASSWORD);
        await research(driver,"groupTextSearch","Rock");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_5_NAME,TEAM_3_NAME], [TEAM_1_NAME,TEAM_2_NAME,TEAM_4_NAME,TEAM_6_NAME]);
    });

    test('research for group(s) with inexact search text', async () => {
        await research(driver,"groupTextSearch","cket");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_4_NAME,TEAM_5_NAME], [TEAM_1_NAME,TEAM_2_NAME,TEAM_3_NAME,TEAM_6_NAME]);
    });

    test('research for group(s) with exact search text', async () => {
        await research(driver,"groupTextSearch","HomeSweetHome");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_6_NAME], [TEAM_1_NAME,TEAM_2_NAME,TEAM_3_NAME,TEAM_4_NAME,TEAM_5_NAME]);
    });

    test('empty research for group', async () => {
        await driver.get(URL);
        await research(driver,"groupTextSearch","");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_1_NAME,TEAM_2_NAME,TEAM_3_NAME,TEAM_4_NAME,TEAM_5_NAME,TEAM_6_NAME], []);
    });

    test('research with less than 3 char', async () => {
        await research(driver,"groupTextSearch", "ck");
        let title = await driver.getTitle();
        await expect(title).toContain("Aucun résultat de recherche de groupe");
    });

    test('research by id', async () => {
        await driver.get(URL);
        await research(driver,"groupTextSearch","1");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_1_NAME], [TEAM_2_NAME,TEAM_3_NAME,TEAM_4_NAME,TEAM_5_NAME,TEAM_6_NAME]);
    });

    test('research with multiple queries', async () => {
        await research(driver,"groupTextSearch","1 blue Home");
        let title = await driver.getTitle();
        await expect(title).toContain("Groupes");
        await verifyContainingOrNot(driver, 'Teams', [TEAM_1_NAME,TEAM_4_NAME,TEAM_6_NAME], [TEAM_2_NAME,TEAM_3_NAME,TEAM_5_NAME]);
    });

    test('inconclusive research', async () => {
        await research(driver,"groupTextSearch", "chipolatas");
        let title = await driver.getTitle();
        await expect(title).toContain("Aucun résultat de recherche de groupe");
    });

});

describe('(8) Search in todolist', () => {
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
        dbo = await connection.db(DATABASE);
        await driver.manage().deleteAllCookies();
        driver.manage().window().maximize();
    }, 15000);

    afterAll(async () => {
        await driver.quit();
        await connection.close();
    }, 15000);

    test('research by accountant name with one query', async () => {
        await driver.get(URL);
        await logIn(driver, ACCOUNT_1_USERNAME, ACCOUNT_1_PASSWORD);
        await clickButton(driver, '1');
        await clickButton(driver, 'TodoListIcon');
        await addTask(driver, 'nettoyer le sol', '10022020', [ACCOUNT_1_USERNAME, ACCOUNT_2_USERNAME]);
        await addTask(driver, 'cuire les saucisses', '15022020', [ACCOUNT_1_USERNAME]);
        await addTask(driver, 'nettoyer les vitres', '12022020', [ACCOUNT_2_USERNAME]);
        await clickButton(driver, 'donebtn 2')
        await research(driver,"todoTextSearch",'first');
        let title = await driver.getTitle();
        await expect(title).toContain("TodoList");
        await verifyContainingOrNot(driver, 'done', ['nettoyer le sol'], ['cuire les saucisses','nettoyer les vitres']);
        await verifyContainingOrNot(driver, 'todo', ['cuire les saucisses'], ['nettoyer le sol','nettoyer les vitres']);
    });

    test('research by task name mith multiple queries', async () => {
        await research(driver,"todoTextSearch",'saucisses vitr');
        let title = await driver.getTitle();
        await expect(title).toContain("TodoList");
        await verifyContainingOrNot(driver, 'done', [], ['cuire les saucisses','nettoyer les vitres','nettoyer le sol']);
        await verifyContainingOrNot(driver, 'todo', ['cuire les saucisses','nettoyer les vitres'], ['nettoyer le sol']);

    });

    test('empty research for task', async () => {
        await research(driver,"todoTextSearch",'');
        let title = await driver.getTitle();
        await expect(title).toContain("TodoList");
        await verifyContainingOrNot(driver, 'done', [], ['cuire les saucisses','nettoyer les vitres','nettoyer le sol']);
        await verifyContainingOrNot(driver, 'todo', [], ['cuire les saucisses','nettoyer les vitres','nettoyer le sol']);
    });

    test('research with less than 3 char', async () => {
        await research(driver,"todoTextSearch",'sa');
        let title = await driver.getTitle();
        await expect(title).toContain("Aucun résultat de recherche");
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

async function switchAccountAndGetToApp(driver, username, password, group, app) {
    /**
     * To switch to another account and move to the an app in a group.
     * @param {String} username : username of the account.
     * @param {String} password : password of the account.
     * @param {String} group : the group to click.
     * @param {String} app : the app to click.
     */
    await logOut(driver);
    await logIn(driver, username, password);
    await clickButton(driver, group);
    await clickButton(driver, app);
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
     * @param {String} task : name of the task.
     * @param {String} date : if day = 20, month = 11, year = 2020, date should be in format "20112020".
     * @param {Array} accountants : list of the accountants.
     * Ex : ['simon','louis','pierre']
     */
    let correctDate = date;
    if (BROWSER_LANGUAGE == "en") correctDate = date.substring(2, 4) + date.substring(0, 2) + date.substring(4, 8);
    await driver.findElement(By.id('task')).sendKeys(task);
    await driver.findElement(By.id('date')).sendKeys(correctDate);
    await driver.actions().keyDown(Key.CONTROL).perform();
    for (accountant of accountants) {
        await driver.findElement(By.id(accountant)).click();
    }
    await driver.actions().keyUp(Key.CONTROL).perform();
    await clickButton(driver, 'submitTask');
}

async function verifyTask(dbo, groupId, taskId, title, accountants, date, done) {
    /**
     * @param {String} groupId : id of the groupe (! string).
     * @param {int} taskId : id of the task.
     * @param {String} title : title of the task.
     * @param {Array} accountants : Array of the accountants.
     * @param {String} date : if day = 20, month = 11, year = 2020, date should be in format "20112020".
     * @param {Boolean} done : state of the task.
     */
    dbo.collection('todo').findOne({ "groupe": groupId }, function (err, todoOfTheGroup) {
        expect(todoOfTheGroup).not.toBeNull();
        let addedTask = todoOfTheGroup.tasks[taskId];
        expect(addedTask["task"]).toEqual(title);
        for (let name of accountants) {
            expect(addedTask["accountant"]).toContain(name);
        }
        expect(addedTask["date"]).toEqual(date.substring(0, 2) + '/' + date.substring(2, 4) + '/' + date.substring(4, 8));
        expect(addedTask["done"]).toEqual(done);
    });
}

async function addEvent(driver, eventTitle, date, participants) {
    /**
     * @param {String} eventTitle : name of the event.
     * @param {String} date : if day = 20, month = 11, year = 2020, date should be in format "20112020".
     * @param {Array} participants : list of the accountants.
     * Ex : ['simon','louis','pierre']
     */
    let correctDate = date;
    if (BROWSER_LANGUAGE == "en") correctDate = date.substring(2, 4) + date.substring(0, 2) + date.substring(4, 8);
    await driver.findElement(By.id('event')).sendKeys(eventTitle);
    await driver.findElement(By.id('date')).sendKeys(correctDate);
    await driver.actions().keyDown(Key.CONTROL).perform();
    for (participant of participants) {
        await driver.findElement(By.id(participant)).click();
    }
    await driver.actions().keyUp(Key.CONTROL).perform();
    await clickButton(driver, 'submitEvent');
}

async function verifyEvent(dbo, groupId, eventId, title, participants, date) {
    /**
     * @param {String} groupId : id of the groupe (! string).
     * @param {int} eventId : id of the event.
     * @param {String} title : title of the event.
     * @param {Array} participants : Array of the participants.
     * @param {String} date : if day = 20, month = 11, year = 2020, date should be in format "20112020".
     */
    dbo.collection('planning').findOne({ "groupe": groupId }, function (err, planningOfTheGroup) {
        expect(planningOfTheGroup).not.toBeNull();
        let addedEvent = planningOfTheGroup.events[eventId];
        expect(addedEvent["event"]).toEqual(title);
        for (let name of participants) {
            expect(addedEvent["participants"]).toContain(name);
        }
        expect(addedEvent["date"]).toEqual(date.substring(0, 2) + '/' + date.substring(2, 4) + '/' + date.substring(4, 8));
    });
}

async function addExpense(driver, title, date, amount, payeur, receveurs) {
    /**
     * @param {String} title : title of the expense.
     * @param {String} date : date of the expense.
     * @param {int} amount : amount of the expense.
     * @param {String} payeur : creditor of the expense.
     * @param {Array} receveurs : Array of the debtors.
     * Ex : ['simon','louis','pierre']
     */
    let correctDate = date;
    if (BROWSER_LANGUAGE == "en") correctDate = date.substring(2, 4) + date.substring(0, 2) + date.substring(4, 8);
    await driver.findElement(By.id('expenseTitle')).sendKeys(title);
    await driver.findElement(By.id('date')).sendKeys(correctDate);
    await driver.findElement(By.id('amount')).sendKeys(amount);
    await driver.findElement(By.id('payeur')).click();
    await driver.findElement(By.id('payeurName '+payeur)).click();
    await driver.actions().keyDown(Key.CONTROL).perform();
    for (receveur of receveurs) {
        await driver.findElement(By.id(receveur)).click();
    }
    await driver.actions().keyUp(Key.CONTROL).perform();
    await clickButton(driver, 'submitExpense');
}

async function verifyExpense(dbo, groupId, expenseId, title, date, amount, payeur, receveurs) {
    /**
     * @param {String} groupId : id of the groupe (! string).
     * @param {int} expenseId : id of the expense.
     * @param {String} title : title of the expense.
     * @param {String} date : date of the expense.
     * @param {int} amount : amount of the expense.
     * @param {String} payeur : creditor of the expense.
     * @param {Array} receveurs : Array of the debtors.
     */
    dbo.collection('expenses').findOne({ "groupe": groupId }, function (err, expensesOfTheGroup) {
        expect(expensesOfTheGroup).not.toBeNull();
        let addedExpense = expensesOfTheGroup.expensesArray[expenseId];
        expect(addedExpense["title"]).toEqual(title);
        expect(addedExpense["date"]).toEqual(date.substring(0, 2) + '/' + date.substring(2, 4) + '/' + date.substring(4, 8));
        expect(addedExpense["amount"]).toEqual(amount.toString());
        expect(addedExpense["payeur"]).toEqual(payeur);
        for (let name of receveurs) {
            expect(addedExpense["receveurs"]).toContain(name);
        }
        let updatedMoneyAccounts = expensesOfTheGroup.cache[0];
        let updatedTransactions = expensesOfTheGroup.cache[1];
    });
}

async function verifyExpensesSolver(dbo, groupId, usernames, money, debtors, creditors, amounts) {
    /**
     * @param {String} groupId : id of the groupe (! string).
     * @param {Array} usernames : Array of strings of all the usernames used in any transaction.
     * @param {Array} money : Array of strings of all money accounts corresponding with the usernames.
     * @param {Array} debtors : Array of strings of the usernames of the people that have to refund someone else.
     * @param {Array} creditors : Array of strings of the usernames of the people that have to be refunded by the corresponding detor.
     * @param {Array} amounts : Array of int of the corresponding amounts that have to be refunded.
     */
    dbo.collection('expenses').findOne({ "groupe": groupId }, function (err, expensesOfTheGroup) {
        expect(expensesOfTheGroup).not.toBeNull();
        let updatedMoneyAccounts = expensesOfTheGroup.cache[0];
        let updatedTransactions = expensesOfTheGroup.cache[1];
        for (let i = 0; i < updatedMoneyAccounts.length; i++) {
            expect(updatedMoneyAccounts[i]["people"]).toEqual(usernames[i]);
            expect(updatedMoneyAccounts[i]["money"]).toEqual(money[i]);
        }
        for (let i = 0; i < updatedTransactions.length; i++) {
            expect(updatedTransactions[i]["debtor"]).toEqual(debtors[0]);
            expect(updatedTransactions[i]["creditor"]).toEqual(creditors[0]);
            expect(updatedTransactions[i]["howMuch"]).toEqual(amounts[0]);
        }
    });

}

async function research(driver, id, searchText) {
    /**
     * @param {String} id : id of the searchText zone
     * @param {String} searchText : text to search with
     */
    await driver.findElement(By.id(id)).sendKeys(searchText);
    await clickButton(driver, "searchbtn");
}

async function verifyContainingOrNot(driver, id, containing, notContaining) {
    /**
     * @param {String} id : id of the element you need to check if it contains or not some text
     * @param {Array} containing : list of text the element by id should be containing
     * @param {Array} notContaining : list of text the element by id shouldn't be containing
     */
    let teams = await driver.findElement(By.id(id)).getAttribute('innerHTML');
    for (item of containing) {
        await expect(teams).toContain(item);
    }
    for (item of notContaining) {
        await expect(teams).toEqual(expect.not.stringContaining(item));
    }

}
