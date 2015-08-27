/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-easy-forms-patched',

  included: function(app) {
    this._super.included(app);

    app.import('vendor/ember-easyForm.js')
  }
};
