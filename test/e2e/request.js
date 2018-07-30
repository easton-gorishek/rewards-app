const { createServer } = require('http');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const app = require('../../lib/app');
const server = createServer(app);
const request = chai.request(server).keepOpen();

request.checkOk = res => {
    if(res.status !== 200) {
        console.log(res.status);
        throw new Error('Expected 200 http status code');
    }
    return res;
};

after(done => server.close(done));

module.exports = request;