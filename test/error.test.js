const { ConfigurationIsMissingError, InputValidationError } = require('../lib/error/DomainError')
const assert = require('assert').strict;
const expect = require('chai').expect
const TestHelper =  require('./TestHelper');

describe("DomainError", function() {

    it("should manage ConfigurationIsMissingError", function() {
        try {
          throw new ConfigurationIsMissingError('my configuration');
          should.fail('expect ConfigurationIsMissingError');
        } catch (err) {
          expect(err.name).to.eql('ConfigurationIsMissingError');
          expect(err.message).to.eql('Configuration \'my configuration\' is missing.');
          expect(err.data.configuration).to.eql('my configuration');
        }
    });

    it("should manage InputValidationError", function() {
        try {
          throw new InputValidationError('my field', 'my value', 'this is a stupid test');
          should.fail('expect InputValidationError');
        } catch (err) {
          expect(err.name).to.eql('InputValidationError');
          expect(err.message).to.eql('Field \'my field\' is invalid: \'this is a stupid test\'');
          expect(err.data.field).to.eql('my field');
          expect(err.data.fieldValue).to.eql('my value');
          expect(err.data.error).to.eql('this is a stupid test');
        }
    });

});