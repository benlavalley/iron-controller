Package.describe({
  name: 'iron:controller',
  summary: 'Controller class for dynamic layouts.',
  version: '1.0.13',
  git: 'https://github.com/iron-meteor/iron-controller'
});

Package.on_use(function (api) {
  api.versionsFrom('METEOR@1.8.1');

  api.use('underscore');
  api.use('tracker'); // reactivity
  api.use('reactive-dict'); // reactive state variables
  api.use('templating');

  api.use('iron:core@1.0.12');
  api.imply('iron:core');

  api.use('iron:layout@1.0.13');
  api.use('iron:dynamic-template@1.0.13');

  api.add_files('lib/wait_list.js', 'client');
  api.add_files('lib/controller.js');
  api.add_files('lib/controller_server.js', 'server');
  api.add_files('lib/controller_client.js', 'client');
});

Package.on_test(function (api) {
  api.use('iron:controller');
  api.use('iron:layout');
  api.use('tinytest');
  api.use('test-helpers');
  api.use('tracker');
  api.use('templating');

  api.add_files('test/controller_test.html', 'client');
  api.add_files('test/wait_list_test.js', 'client');
  api.add_files('test/controller_test.js', 'client');
});
