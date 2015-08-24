// ==========================================================================
// Project:   Ember EasyForm
// Copyright: Copyright 2013 DockYard, LLC. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


 // Version: 1.0.0.beta.1

(function() {
Ember.EasyForm = Ember.Namespace.create({
  VERSION: '1.0.0.beta.1'
});

})();



(function() {
Ember.EasyForm.Config = Ember.Namespace.create({
  _wrappers: {
    'default': {
      formClass: '',
      fieldErrorClass: 'fieldWithErrors',
      inputClass: 'input',
      errorClass: 'error',
      hintClass: 'hint',
      labelClass: '',
      inputTemplate: 'easyForm/input',
      errorTemplate: 'easyForm/error',
      labelTemplate: 'easyForm/label',
      hintTemplate: 'easyForm/hint',
      wrapControls: false,
      controlsWrapperClass: '',
      buttonClass: ''
    }
  },
  modulePrefix: 'appkit',
  _inputTypes: {},
  _templates: {},
  registerWrapper: function(name, wrapper) {
    this._wrappers[name] = Ember.$.extend({}, this._wrappers['default'], wrapper);
  },
  getWrapper: function(name) {
    var wrapper = this._wrappers[name];
    Ember.assert("The wrapper '" + name + "' was not registered.", wrapper);
    return wrapper;
  },
  registerInputType: function(name, type){
    this._inputTypes[name] = type;
  },
  getInputType: function(name) {
    return this._inputTypes[name];
  },
  registerTemplate: function(name, template) {
    this._templates[name] = template;
  },
  getTemplate: function(name) {
    return this._templates[name];
  }
});

})();



(function() {
Ember.Handlebars.registerHelper('error-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);

  if (options.hash.propertyBinding) {
    options.hash.property = options.data.view.getStream(options.hash.propertyBinding).value();
  }
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Error, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('form-for', function(object, options) {
  var parentView = options.data.view;

  Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Form, options);

  var newView = parentView._childViews[parentView._childViews.length - 1];

  newView._keywords.formForModelPath = object;

  return newView;
});

})();



(function() {
Ember.Handlebars.registerHelper('hint-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);

  if (options.hash.text || options.hash.textBinding) {
    return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Hint, options);
  }
});

})();



(function() {
Ember.Handlebars.helpers['ember-input'] = Ember.Handlebars.helpers['input'];

Ember.Handlebars.registerHelper('input', function(property, options) {
  if (arguments.length === 1) {
    return Ember.Handlebars.helpers['ember-input'].call(this, arguments[0]);
  }

  options = Ember.EasyForm.processOptions(property, options);
  options.hash.isBlock = !!(options.fn);
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Input, options);
});

})();



(function() {
var get = Ember.get,
    set = Ember.set;

Ember.Handlebars.registerHelper('input-field', function(property, options) {
  function handlebarsGet(root, path, options) {
    return options.data.view.getStream(path).value();
  }


  options = Ember.EasyForm.processOptions(property, options);

  if (options.hash.propertyBinding) {
    options.hash.property = handlebarsGet(this, options.hash.propertyBinding, options);
  }

  if (options.hash.inputOptionsBinding) {
    options.hash.inputOptions = handlebarsGet(this, options.hash.inputOptionsBinding, options);
  }

  var modelPath = handlebarsGet(this, 'formForModelPath', options);
  options.hash.modelPath = modelPath;

  property = options.hash.property;

  var modelPropertyPath = function(property) {
    if(!property) { return null; }

    var startsWithKeyword = !!options.data.view._keywords[property.split('.')[0]];

    if (startsWithKeyword) {
      return property;
    }

    if (modelPath) {
      return modelPath + '.' + property;
    } else {
      return property;
    }
  };

  options.hash.valueBinding = modelPropertyPath(property);

  var context = this,
    propertyType = function(property) {
      var constructor = (get(context, 'content') || context).constructor;

      if (constructor.proto) {
        return Ember.meta(constructor.proto(), false).descs[property];
      } else {
        return null;
      }
    };

  options.hash.viewName = 'input-field-'+options.data.view.elementId;

  if (options.hash.inputOptions) {
    var inputOptions = options.hash.inputOptions, optionName;
    for (optionName in inputOptions) {
      if (inputOptions.hasOwnProperty(optionName)) {
       options.hash[optionName] = inputOptions[optionName];
      }
    }
    delete options.hash.inputOptions;
  }

  if (options.hash.as === 'text') {
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextArea, options);
  } else if (options.hash.as === 'select') {
    delete(options.hash.valueBinding);

    options.hash.contentBinding   = modelPropertyPath(options.hash.collection);
    options.hash.selectionBinding = modelPropertyPath(options.hash.selection);
    options.hash.valueBinding     = modelPropertyPath(options.hash.value);

    if (Ember.isNone(options.hash.selectionBinding) && Ember.isNone(options.hash.valueBinding)) {
      options.hash.selectionBinding = modelPropertyPath(property);
    }

    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Select, options);
  } else if (options.hash.as === 'checkbox') {
    if (Ember.isNone(options.hash.checkedBinding)) {
      options.hash.checkedBinding = modelPropertyPath(property);
    }

    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Checkbox, options);
  } else {
    if (!options.hash.as) {
      if (property.match(/password/)) {
        options.hash.type = 'password';
      } else if (property.match(/email/)) {
        options.hash.type = 'email';
      } else if (property.match(/url/)) {
        options.hash.type = 'url';
      } else if (property.match(/color/)) {
        options.hash.type = 'color';
      } else if (property.match(/^tel/)) {
        options.hash.type = 'tel';
      } else if (property.match(/search/)) {
        options.hash.type = 'search';
      } else {
        if (propertyType(property) === 'number' || typeof(get(context,property)) === 'number') {
          options.hash.type = 'number';
        } else if (propertyType(property) === 'date' || (!Ember.isNone(get(context,property)) && get(context,property).constructor === Date)) {
          options.hash.type = 'date';
        } else if (propertyType(property) === 'boolean' || (!Ember.isNone(context.get(property)) && get(context,property).constructor === Boolean)) {
          options.hash.checkedBinding = property;
          return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.Checkbox, options);
        }
      }
    } else {
      var inputType = Ember.EasyForm.Config.getInputType(options.hash.as);
      if (inputType) {
        return Ember.Handlebars.helpers.view.call(context, inputType, options);
      }

      options.hash.type = options.hash.as;
    }
    return Ember.Handlebars.helpers.view.call(context, Ember.EasyForm.TextField, options);
  }
});

})();



(function() {
Ember.Handlebars.registerHelper('label-field', function(property, options) {
  options = Ember.EasyForm.processOptions(property, options);
  options.hash.viewName = 'label-field-'+options.data.view.elementId;
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Label, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('submit', function(value, options) {
  if (typeof(value) === 'object') {
    options = value;
    value = undefined;
  }
  options.hash.context = this;
  options.hash.value = value || 'Submit';
  return (options.hash.as === 'button') ?
    Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Button, options)
    :
    Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Submit, options);
});

})();



(function() {
Ember.Handlebars.registerHelper('input-unbound', function(options) {
  //options = Ember.EasyForm.processOptions(property, options);
  options.hash.isBlock = !!(options.fn);
  return Ember.Handlebars.helpers.view.call(this, Ember.EasyForm.Input, options);
});

})();



(function() {

})();



(function() {
Ember.EasyForm.BaseView = Ember.View.extend({
  classNameBindings: ['property'],
  wrapper: function() {
    var wrapperView = this.nearestWithProperty('wrapper');
    if (wrapperView) {
      return wrapperView.get('wrapper');
    } else {
      return 'default';
    }
  }.property(),
  wrapperConfig: function() {
    return Ember.EasyForm.Config.getWrapper(this.get('wrapper'));
  }.property('wrapper'),
  templateForName: function(name) {
    var template;

    if (this.container) {
      template = this.container.lookup('template:' + name);
    }

    return template || Ember.EasyForm.Config.getTemplate(name);
  },
  formForModel: function(){
    var formForModelPath = this._keywords.formForModelPath;

    if (formForModelPath === 'context' || formForModelPath === 'controller' || formForModelPath === 'this') {
      return this.get('context');
    } else if (formForModelPath) {
      return this.get('context.' + formForModelPath);
    } else {
      return this.get('context');
    }
  }.property()
});

})();



(function() {
Ember.EasyForm.Checkbox = Ember.Checkbox.extend();

})();



(function() {
Ember.EasyForm.Error = Ember.EasyForm.BaseView.extend({
  tagName: 'span',
  classNameBindings: ['wrapperConfig.errorClass'],
  init: function() {
    this._super();
    Ember.Binding.from('formForModel.errors.' + this.property).to('errors').connect(this);
  },
  templateName: Ember.computed.oneWay('wrapperConfig.errorTemplate'),
  errorText: Ember.computed.oneWay('errors.firstObject')
});

})();



(function() {
Ember.EasyForm.Form = Ember.EasyForm.BaseView.extend({
  tagName: 'form',
  attributeBindings: ['novalidate'],
  classNameBindings: ['wrapperConfig.formClass'],
  novalidate: 'novalidate',
  wrapper: 'default',
  init: function() {
    this._super();
    this.action = this.action || 'submit';
  },
  submit: function(event) {
    var _this = this,
        promise;

    if (event) {
      event.preventDefault();
    }

    if (Ember.isNone(this.get('formForModel.validate'))) {
      this.get('controller').send(this.action);
    } else {
      if (!Ember.isNone(this.get('formForModel').validate)) {
        promise = this.get('formForModel').validate();
      } else {
        promise = this.get('formForModel.content').validate();
      }
      promise.then(function() {
        if (_this.get('formForModel.isValid')) {
          _this.get('controller').send(_this.action);
        }
      });
    }
  }
});

})();



(function() {
Ember.EasyForm.Hint = Ember.EasyForm.BaseView.extend({
  tagName: 'span',
  classNameBindings: ['wrapperConfig.hintClass'],
  templateName: Ember.computed.oneWay('wrapperConfig.hintTemplate'),
  hintText: Ember.computed.oneWay('text')
});

})();



(function() {
Ember.EasyForm.Input = Ember.EasyForm.BaseView.extend({
  init: function() {
    this._super();
    this.classNameBindings.push('showError:' + this.get('wrapperConfig.fieldErrorClass'));
    Ember.defineProperty(this, 'showError', Ember.computed.and('canShowValidationError', 'formForModel.errors.' + this.property + '.firstObject'));
    if (!this.isBlock) {
      this.set('templateName', this.get('wrapperConfig.inputTemplate'));
    }
  },
  setupValidationDependencies: function() {
    var keys = this.get('formForModel._dependentValidationKeys'), key;
    if (keys) {
      for(key in keys) {
        if (keys[key].contains(this.property)) {
          this._keysForValidationDependencies.pushObject(key);
        }
      }
    }
  }.on('init'),
  _keysForValidationDependencies: Ember.A(),
  dependentValidationKeyCanTrigger: false,
  tagName: 'div',
  classNames: ['string'],
  classNameBindings: ['wrapperConfig.inputClass'],
  didInsertElement: function() {
    var name = 'label-field-'+this.elementId,
        label = this.get(name);
    if (!label) { return; }
    this.set(name+'.for', this.get('input-field-'+this.elementId+'.elementId'));
  },
  concatenatedProperties: ['inputOptions', 'bindableInputOptions'],
  inputOptions: ['as', 'collection', 'optionValuePath', 'optionLabelPath', 'selection', 'value', 'multiple', 'name'],
  bindableInputOptions: ['placeholder', 'prompt', 'disabled'],
  defaultOptions: {
    name: function(){
      if (this.property) {
        return this.property;
      }
    }
  },
  inputOptionsValues: function() {
    var options = {}, i, key, keyBinding, value, inputOptions = this.inputOptions, bindableInputOptions = this.bindableInputOptions, defaultOptions = this.defaultOptions;
    for (i = 0; i < inputOptions.length; i++) {
      key = inputOptions[i];
      if (this[key]) {
        if (typeof(this[key]) === 'boolean') {
          this[key] = key;
        }

        options[key] = this[key];
      }
    }
    for (i = 0; i < bindableInputOptions.length; i++) {
      key = bindableInputOptions[i];
      keyBinding = key + 'Binding';
      if (this[key] || this[keyBinding]) {
        options[keyBinding] = 'view.' + key;
      }
    }

    for (key in defaultOptions) {
      if (!defaultOptions.hasOwnProperty(key)) { continue; }
      if (options[key]) { continue; }

      if (value = defaultOptions[key].apply(this)) {
        options[key] = value;
      }
    }

    return options;
  }.property(),
  focusOut: function() {
    this.set('hasFocusedOut', true);
    this.showValidationError();
  },
  showValidationError: function() {
    if (this.get('hasFocusedOut')) {
      if (Ember.isEmpty(this.get('formForModel.errors.' + this.property))) {
        this.set('canShowValidationError', false);
      } else {
        this.set('canShowValidationError', true);
      }
    }
  },
  input: function() {
    this._keysForValidationDependencies.forEach(function(key) {
     this.get('parentView.childViews').forEach(function(view) {
       if (view.property === key) {
         view.showValidationError();
       }
     }, this);
    }, this);
  }
});

})();



(function() {
Ember.EasyForm.Label = Ember.EasyForm.BaseView.extend({
  tagName: 'label',
  attributeBindings: ['for'],
  classNameBindings: ['wrapperConfig.labelClass'],
  labelText: function() {
    return this.get('text') || Ember.EasyForm.humanize(this.get('property'));
  }.property('text', 'property'),
  templateName: Ember.computed.oneWay('wrapperConfig.labelTemplate')
});

})();



(function() {
Ember.EasyForm.Select = Ember.Select.extend();

})();



(function() {
Ember.EasyForm.Submit = Ember.EasyForm.BaseView.extend({
  tagName: 'input',
  attributeBindings: ['type', 'value', 'disabled'],
  classNameBindings: ['wrapperConfig.buttonClass'],
  type: 'submit',
  disabled: function() {
    return !this.get('formForModel.isValid');
  }.property('formForModel.isValid'),
  init: function() {
    this._super();
    this.set('value', this.value);
  }
});

})();



(function() {
Ember.EasyForm.Button = Ember.EasyForm.BaseView.extend({
  tagName: 'button',
  template: Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "text", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true}),
  attributeBindings: ['type', 'disabled'],
  type: 'submit',
  disabled: function() {
    return !this.get('formForModel.isValid');
  }.property('formForModel.isValid'),
  init: function() {
    this._super();
    this.set('formForModel.text', this.value);
  }
});

})();



(function() {
Ember.EasyForm.TextArea = Ember.TextArea.extend();

})();



(function() {
Ember.EasyForm.TextField = Ember.TextField.extend();

})();



(function() {

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/error', Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "view.errorText", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/hint', Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "view.hintText", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/input', Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push(escapeExpression(((helpers['label-field'] || (depth0 && depth0['label-field']) || helperMissing).call(depth0, {"name":"label-field","hash":{
    'textBinding': ("view.label"),
    'propertyBinding': ("view.property")
  },"hashTypes":{'textBinding': "STRING",'propertyBinding': "STRING"},"hashContexts":{'textBinding': depth0,'propertyBinding': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push(escapeExpression(((helpers.partial || (depth0 && depth0.partial) || helperMissing).call(depth0, "easyForm/inputControls", {"name":"partial","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  return buffer;
},"useData":true}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/inputControls', Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  data.buffer.push(escapeExpression(((helpers['error-field'] || (depth0 && depth0['error-field']) || helperMissing).call(depth0, {"name":"error-field","hash":{
    'propertyBinding': ("view.property")
  },"hashTypes":{'propertyBinding': "STRING"},"hashContexts":{'propertyBinding': depth0},"types":[],"contexts":[],"data":data}))));
  },"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  data.buffer.push(escapeExpression(((helpers['hint-field'] || (depth0 && depth0['hint-field']) || helperMissing).call(depth0, {"name":"hint-field","hash":{
    'textBinding': ("view.hint"),
    'propertyBinding': ("view.property")
  },"hashTypes":{'textBinding': "STRING",'propertyBinding': "STRING"},"hashContexts":{'textBinding': depth0,'propertyBinding': depth0},"types":[],"contexts":[],"data":data}))));
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push(escapeExpression(((helpers['input-field'] || (depth0 && depth0['input-field']) || helperMissing).call(depth0, {"name":"input-field","hash":{
    'inputOptionsBinding': ("view.inputOptionsValues"),
    'propertyBinding': ("view.property")
  },"hashTypes":{'inputOptionsBinding': "STRING",'propertyBinding': "STRING"},"hashContexts":{'inputOptionsBinding': depth0,'propertyBinding': depth0},"types":[],"contexts":[],"data":data}))));
  stack1 = helpers['if'].call(depth0, "view.showError", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers['if'].call(depth0, "view.hint", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"useData":true}));

})();



(function() {
Ember.EasyForm.Config.registerTemplate('easyForm/label', Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "view.labelText", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true}));

})();



(function() {

})();



(function() {
Ember.EasyForm.humanize = function(string) {
  return string.underscore().split('_').join(' ').capitalize();
};

Ember.EasyForm.eachTranslatedAttribute = function(object, fn) {
  var isTranslatedAttribute = /(.+)Translation$/,
      isTranslatedAttributeMatch;

  for (var key in object) {
    isTranslatedAttributeMatch = key.match(isTranslatedAttribute);
    if (isTranslatedAttributeMatch) {
      fn.call(object, isTranslatedAttributeMatch[1], Ember.I18n.t(object[key]));
    }
  }
};

Ember.EasyForm.processOptions = function(property, options) {
  if (options) {
    if (Ember.I18n) {
      var eachTranslatedAttribute = Ember.I18n.eachTranslatedAttribute || Ember.EasyForm.eachTranslatedAttribute;
      eachTranslatedAttribute(options.hash, function (attribute, translation) {
        options.hash[attribute] = translation;
        delete options.hash[attribute + 'Translation'];
      });
    }
    options.hash.property = property;
  } else {
    options = property;
  }

  return options;
};

})();



(function() {

})();

