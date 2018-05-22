/* eslint-disable import/no-dynamic-require,global-require,no-undef,array-callback-return,new-cap */
const chai = require('chai');
const { expect } = require('chai');
const fs = require('fs');
const UowFactory = require('../assets/helpers/database/uow_factory');

const modelFiles = fs.readdirSync('./assets/models')
  .map(a => a.replace(/\.js/g, ''))
  .filter(a => a !== 'BaseObject');
const models = modelFiles.map(model => require(`../assets/models/${model}`));

const should = chai.should();

describe('Object retrieval tests', () => {
  let uow;
  beforeEach((done) => {
    UowFactory.create()
      .then((u) => {
        uow = u;
        done();
      }).catch(err => done(err));
  });

  afterEach((done) => {
    uow.complete();
    done();
  });
  models.map((model) => {
    describe(`Testing ${model.name}`, () => {
      describe(`Get all ${model.name}`, () => {
        it(`it should get all objects of type ${model.name}`, async (done) => {
          try {
            const result = await model.getAll(uow);
            result.on('data', console.log);
            result.on('end', () => done());
          } catch (e) {
            if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
              done(e);
            }
          }
        });
      });

      describe(`Add new ${model.name}`, () => {
        it(`it should add a new test ${model.name}`, (done) => {
          model.generateTestData(uow)
            .then((m) => {
              const result = m.add();
              should.not.equal(result, null); // TODO: Add actual test condition
              done();
            }).catch((e) => {
              if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
                done(e);
              } else {
                done();
              }
            });
        });
      });
    });
  });
});
