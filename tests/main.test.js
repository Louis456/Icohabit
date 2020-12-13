require('chromedriver');
const {Builder,By,Key,Util} = require('selenium-webdriver');
const script = require('jest');
const { beforeAll } = require('@jest/globals');

const url = 'http://www.google.com';
