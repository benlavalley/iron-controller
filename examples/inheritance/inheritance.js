if (Meteor.isClient) {
  ParentController = Iron.Controller.extend({
    parentGreeting: function () {
      return 'Hello from Parent!';
    }
  });

  ChildController = ParentController.extend({
    childGreeting: function () {
      return 'Hello from Child!';
    }
  });

  Template.Page.helpers({
    parentGreeting: function () {
      return UI.controller().parentGreeting();
    },

    childGreeting: function () {
      return UI.controller().childGreeting();
    }
  });

  Meteor.startup(function () {
    controller = new ChildController;
    controller.insert({el: document.body});
    controller.render('Page');
  });
}
