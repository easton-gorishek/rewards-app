const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./_db');
const { checkOk } = request;
// const { Types } = require('mongoose');

describe('Sales API', () => {
    
    beforeEach(() => {
        dropCollection('sales');
        dropCollection('users');
        dropCollection('bars');
    });

    let easton;
    let token;
    beforeEach(() => {
        return request
            .post('/api/auth/signup')
            .send({
                _id: '5b5f6a4cdf814a1d71aea3c8',
                name: 'Easton',
                year: 1990,
                email: 'easton@acl.com',
                password: 'password',
                roles: ['customer', 'owner', 'admin']
            })
            .then(({ body }) => {
                token = body.token;
                console.log('EASTONS', token);
                easton = body.user;
            });
    });

    let lifeOfRiley;
    beforeEach(() => {
        let bar = {
            name: 'Life of Riley',
            location: {
                address: 'Somewhere in the Pearl',
                city: 'Portland',
                state: 'OR',
                zip: '97777'
            },
            phone: '9711234567',
            hours: 'All day err day',
            owner: easton._id
        };
        return request
            .post('/api/bars')
            .set('Authorization', token)
            .send(bar)
            .then(checkOk)
            .then(({ body }) => {
                lifeOfRiley = body;
            });
    });

    let teardrop;
    beforeEach(() => {
        let bar = {
            name: 'Teardrop',
            location: {
                address: 'Also in the Pearl',
                city: 'Portland',
                state: 'OR',
                zip: '97777'
            },
            phone: '5031234567',
            hours: 'Lots of hours',
            owner: easton._id
        };
        return request
            .post('/api/bars')
            .set('Authorization', token)
            .send(bar)
            .then(checkOk)
            .then(({ body }) => {
                teardrop = body;
            });
    });

    let sale;
    beforeEach(() => {
        return request
            .post('/api/sales')
            .set('Authorization', token)
            .send({
                bar: lifeOfRiley._id,
                customer: easton._id, 
                drinks: [{
                    type: 'beer',
                    name:'Breakside IPA',
                    price: 5,
                    quantity: 2
                },
                {
                    type: 'beer',
                    name:'Vortex IPA',
                    price: 5,
                    quantity: 1
                }],
                food: [{
                    type: 'entree',
                    price: 10,
                    quantity: 1
                }],
                totalAmountSpent: 30
            })
            .then(({ body }) => sale = body);
    });
    

    let saleTwo;
    beforeEach(() => {
        return request
            .post('/api/sales')
            .set('Authorization', token)
            .send({
                bar: lifeOfRiley._id,
                customer: easton._id, 
                drinks: [{
                    type: 'wine',
                    name:'Merlot',
                    price: 5,
                    quantity: 2
                }],
                food: [{
                    type: 'dessert',
                    price: 5,
                    quantity: 1
                },
                {
                    type: 'starter',
                    price: 5,
                    quantity: 2
                }],
                totalAmountSpent: 25
            })
            .then(({ body }) => saleTwo = body);
    });

    let saleThree;
    beforeEach(() => {
        return request
            .post('/api/sales')
            .set('Authorization', token)
            .send({
                bar: teardrop._id,
                customer: easton._id, 
                drinks: [{
                    type: 'beer',
                    name:'Breakside IPA',
                    price: 5,
                    quantity: 2
                },
                {
                    type: 'beer',
                    name:'Vortex IPA',
                    price: 5,
                    quantity: 1
                }],
                food: [{
                    type: 'entree',
                    price: 10,
                    quantity: 1
                }],
                totalAmountSpent: 30
            })
            .then(({ body }) => saleThree = body);
    });

    const makeSimple = (bar, sale, user) => {
        const simple = {
            _id: sale._id,
            bar: {
                _id: bar._id,
                name: bar.name
            },
            customer: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            totalAmountSpent: sale.totalAmountSpent
        };
        if(sale.drinks) {
            simple.drinks = sale.drinks;
        }
        if(sale.food) {
            simple.food = sale.food;
        }
        return simple;
    };

    const customerInfo = [
        { _id: {
            _id: '5b5f6a4cdf814a1d71aea3c8',
            name: 'Easton',
            email: 'easton@acl.com' },
        totalTickets: 2,
        totalAmtSpent: 55,
        avgAmtSpent: 27.5,
        min: 25,
        max: 30,
        }
    ];

    it('POST a transaction', () => {
        assert.isOk(sale._id);
    });

    it('GET a list of all sales/transactions specific to bar owner', () => {
        return request
            .get('/api/sales')
            .set('Authorization', token)
            .then(checkOk)
            .then(({ body }) => {
                delete body[0].__v;
                delete body[0].createdAt;
                delete body[0].updatedAt;
                delete body[1].__v;
                delete body[1].createdAt;
                delete body[1].updatedAt;
                delete body[2].__v;
                delete body[2].createdAt;
                delete body[2].updatedAt;
                assert.deepEqual(body, [makeSimple(lifeOfRiley, sale, easton), makeSimple(lifeOfRiley, saleTwo, easton), makeSimple(teardrop, saleThree, easton)]);
            });
    });

    it('GETS total revenue by bar owner', () => {
        return request
            .get('/api/sales/revenue-by-owner')
            .set('Authorization', token)
            .then(checkOk)
            .then(({ body }) => {
                assert.isOk(body[0].totalSales);
            });
    });

    it('GET a list of all sales specific to an individual bar', () => {
        return request
            .get(`/api/sales/${sale.bar}`)
            .set('Authorization', token)
            .then(({ body }) => {
                delete body[0].__v;
                delete body[0].createdAt;
                delete body[0].updatedAt;
                delete body[1].__v;
                delete body[1].createdAt;
                delete body[1].updatedAt;
                assert.deepEqual(body, [makeSimple(lifeOfRiley, sale, easton), makeSimple(lifeOfRiley, saleTwo, easton)]);
            });
    });

    it('GET premium customers', () => {
        return request
            .get(`/api/sales/premium-customers/${lifeOfRiley._id}`)
            .set('Authorization', token)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, customerInfo);
            });
    });


    it('Updates a sales transaction if bar owner', () => {
        sale.food[0].type = 'starter';
        sale.totalAmountSpent = 77;
        return request
            .put(`/api/sales/${sale._id}`)
            .set('Authorization', token)
            .send(sale)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body.food.type, sale.food.type);
                assert.deepEqual(body.totalAmountSpent, sale.totalAmountSpent);
            });
    });

    it.skip('Deletes sales transaction by business owner', () => {
        return request
            .delete(`/api/sales/${sale._id}`)
            .set('Authorization', token)
            .then(checkOk)
            .then(res => {
                assert.deepEqual(res.body, { removed: true });
                return request
                    .get('/api/sales')
                    .set('Authorization', token);
            })
            .then(checkOk)
            .then(({ body }) => {
                delete body[0].__v;
                delete body[0].createdAt;
                delete body[0].updatedAt;
                delete body[1].__v;
                delete body[1].createdAt;
                delete body[1].updatedAt;
                assert.deepEqual(body, [makeSimple(lifeOfRiley, saleTwo, easton), makeSimple(teardrop, saleThree, easton)]);
            });
    });

});

