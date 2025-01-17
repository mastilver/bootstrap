describe('$uibModal', function () {
  var $animate, $controllerProvider, $rootScope, $document, $compile, $templateCache, $timeout, $q;
  var $uibModal, $uibModalStack, $uibModalProvider;

  beforeEach(module('ngAnimateMock'));
  beforeEach(module('ui.bootstrap.modal'));
  beforeEach(module('uib/template/modal/backdrop.html'));
  beforeEach(module('uib/template/modal/window.html'));
  beforeEach(module(function(_$controllerProvider_, _$uibModalProvider_, $compileProvider) {
    $controllerProvider = _$controllerProvider_;
    $uibModalProvider = _$uibModalProvider_;
    $compileProvider.directive('parentDirective', function() {
      return {
        controller: function() {
          this.text = 'foo';
        }
      };
    }).directive('childDirective', function() {
      return {
        require: '^parentDirective',
        link: function(scope, elem, attrs, ctrl) {
          scope.text = ctrl.text;
        }
      };
    }).directive('focusMe', function() {
      return {
        link: function(scope, elem, attrs) {
          elem.focus();
        }
      };
    });
  }));

  beforeEach(inject(function(_$animate_, _$rootScope_, _$document_, _$compile_, _$templateCache_, _$timeout_, _$q_, _$uibModal_, _$uibModalStack_) {
    $animate = _$animate_;
    $rootScope = _$rootScope_;
    $document = _$document_;
    $compile = _$compile_;
    $templateCache = _$templateCache_;
    $timeout = _$timeout_;
    $q = _$q_;
    $uibModal = _$uibModal_;
    $uibModalStack = _$uibModalStack_;
  }));

  beforeEach(function() {
    jasmine.addMatchers({
      toBeResolvedWith: function(util, customEqualityTesters) {
        return {
          compare: function(promise, expected) {
            promise.then(function(result) {
              expect(result).toEqual(expected);

              if (result === expected) {
                result.message = 'Expected "' + angular.mock.dump(result) + '" not to be resolved with "' + expected + '".';
              } else {
                result.message = 'Expected "' + angular.mock.dump(result) + '" to be resolved with "' + expected + '".';
              }
            });

            $rootScope.$digest();

            return {pass: true};
          }
        };
      },
      toBeRejectedWith: function(util, customEqualityTesters) {
        return {
          compare: function(promise, expected) {
            var result = {};

            promise.then(function() {

            }, function(result) {
              expect(result).toEqual(expected);

              if (result === expected) {
                result.message = 'Expected "' + angular.mock.dump(result) + '" not to be rejected with "' + expected + '".';
              } else {
                result.message = 'Expected "' + angular.mock.dump(result) + '" to be rejected with "' + expected + '".';
              }
            });

            $rootScope.$digest();

            return {pass: true};
          }
        };
      },
      toHaveModalOpenWithContent: function(util, customEqualityTesters) {
        return {
          compare: function(actual, content, selector) {
            var contentToCompare, modalDomEls = actual.find('body > div.modal > div.modal-dialog > div.modal-content');

            contentToCompare = selector ? modalDomEls.find(selector) : modalDomEls;

            var result = {
              pass: modalDomEls.css('display') === 'block' && contentToCompare.html() === content
            };

            if (result.pass) {
              result.message = '"Expected "' + angular.mock.dump(modalDomEls) + '" not to be open with "' + content + '".';
            } else {
              result.message = '"Expected "' + angular.mock.dump(modalDomEls) + '" to be open with "' + content + '".';
            }

            return result;
          }
        };
      },
      toHaveModalsOpen: function(util, customEqualityTesters) {
        return {
          compare: function(actual, expected) {
            var modalDomEls = actual.find('body > div.modal');

            var result = {
              pass: util.equals(modalDomEls.length, expected, customEqualityTesters)
            };

            if (result.pass) {
              result.message = 'Expected "' + angular.mock.dump(modalDomEls) + '" not to have "' + expected + '" modals opened.';
            } else {
              result.message = 'Expected "' + angular.mock.dump(modalDomEls) + '" to have "' + expected + '" modals opened.';
            }

            return result;
          }
        };
      },
      toHaveBackdrop: function(util, customEqualityTesters) {
        return {
          compare: function(actual, expected) {
            var backdropDomEls = actual.find('body > div.modal-backdrop');

            var result = {
              pass: util.equals(backdropDomEls.length, 1, customEqualityTesters)
            };

            if (result.pass) {
              result.message = 'Expected "' + angular.mock.dump(backdropDomEls) + '" not to be a backdrop element".';
            } else {
              result.message = 'Expected "' + angular.mock.dump(backdropDomEls) + '" to be a backdrop element".';
            }

            return result;
          }
        };
      }
    });
  });

  afterEach(function () {
    var body = $document.find('body');
    body.find('div.modal').remove();
    body.find('div.modal-backdrop').remove();
    body.removeClass('modal-open');
  });

  function triggerKeyDown(element, keyCode, shiftKey) {
    var e = $.Event('keydown');
    e.srcElement = element[0];
    e.which = keyCode;
    e.shiftKey = shiftKey;
    element.trigger(e);
  }

  function open(modalOptions, noFlush) {
    var modal = $uibModal.open(modalOptions);
    $rootScope.$digest();
    if (!noFlush) {
      $animate.flush();
    }
    return modal;
  }

  function close(modal, result, noFlush) {
    var closed = modal.close(result);
    $rootScope.$digest();
    if (!noFlush) {
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
    }
    return closed;
  }

  function dismiss(modal, reason, noFlush) {
    var closed = modal.dismiss(reason);
    $rootScope.$digest();
    if (!noFlush) {
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
    }
    return closed;
  }

  describe('basic scenarios with default options', function() {
    it('should open and dismiss a modal with a minimal set of options', function() {
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      expect($document).not.toHaveBackdrop();
    });

    it('should not throw an exception on a second dismiss', function() {
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      dismiss(modal, 'closing in test', true);
    });

    it('should not throw an exception on a second close', function() {
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      close(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      close(modal, 'closing in test', true);
    });

    it('should open a modal from templateUrl', function() {
      $templateCache.put('content.html', '<div>URL Content</div>');
      var modal = open({templateUrl: 'content.html'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('URL Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      expect($document).not.toHaveBackdrop();
    });

    it('should support closing on ESC', function() {
      var modal = open({template: '<div>Content</div>'});
      expect($document).toHaveModalsOpen(1);

      triggerKeyDown($document, 27);
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);
    });

    it('should not close on ESC if event.preventDefault() was issued', function() {
      var modal = open({template: '<div><button>x</button></div>' });
      expect($document).toHaveModalsOpen(1);

      var button = angular.element('button').on('keydown', preventKeyDown);

      triggerKeyDown(button, 27);
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(1);

      button.off('keydown', preventKeyDown);

      triggerKeyDown(button, 27);
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);

      function preventKeyDown(evt) {
        evt.preventDefault();
      }
    });

    it('should support closing on backdrop click', function() {
      var modal = open({template: '<div>Content</div>'});
      expect($document).toHaveModalsOpen(1);

      $document.find('body > div.modal').click();
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);
    });

    it('should return to the element which had focus before the dialog was invoked', function() {
      var link = '<a href>Link</a>';
      var element = angular.element(link);
      angular.element(document.body).append(element);
      element.focus();
      expect(document.activeElement.tagName).toBe('A');

      var modal = open({template: '<div>Content<button>inside modal</button></div>'});
      $animate.flush();
      $rootScope.$digest();
      expect(document.activeElement.tagName).toBe('DIV');
      expect($document).toHaveModalsOpen(1);

      triggerKeyDown($document, 27);
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();

      expect(document.activeElement.tagName).toBe('A');
      expect($document).toHaveModalsOpen(0);

      element.remove();
    });

    it('should return to document.body if element which had focus before the dialog was invoked is gone, or is missing focus function', function() {
      var link = '<a href>Link</a>';
      var element = angular.element(link);
      angular.element(document.body).append(element);
      element.focus();
      expect(document.activeElement.tagName).toBe('A');

      var modal = open({template: '<div>Content</div>'});
      $animate.flush();
      $rootScope.$digest();
      expect(document.activeElement.tagName).toBe('DIV');
      expect($document).toHaveModalsOpen(1);

      // Fake undefined focus function, happening in IE in certain
      // iframe conditions. See issue 3639
      element[0].focus = undefined;
      triggerKeyDown($document, 27);
      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();

      expect(document.activeElement.tagName).toBe('BODY');
      expect($document).toHaveModalsOpen(0);
      element.remove();
    });

    it('should resolve returned promise on close', function() {
      var modal = open({template: '<div>Content</div>'});
      close(modal, 'closed ok');

      expect(modal.result).toBeResolvedWith('closed ok');
    });

    it('should reject returned promise on dismiss', function() {

      var modal = open({template: '<div>Content</div>'});
      dismiss(modal, 'esc');

      expect(modal.result).toBeRejectedWith('esc');
    });

    it('should reject returned promise on unexpected closure', function() {
      var scope = $rootScope.$new();
      var modal = open({template: '<div>Content</div>', scope: scope});
      scope.$destroy();

      expect(modal.result).toBeRejectedWith('$uibUnscheduledDestruction');

      $animate.flush();
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
      expect($document).toHaveModalsOpen(0);
    });

    it('should resolve the closed promise when modal is closed', function() {
      var modal = open({template: '<div>Content</div>'});
      close(modal, 'closed ok');

      expect(modal.closed).toBeResolvedWith(undefined);
    });

    it('should resolve the closed promise when modal is dismissed', function() {
      var modal = open({template: '<div>Content</div>'});
      dismiss(modal, 'esc');

      expect(modal.closed).toBeResolvedWith(undefined);
    });

    it('should expose a promise linked to the templateUrl / resolve promises', function() {
      var modal = open({template: '<div>Content</div>', resolve: {
          ok: function() {return $q.when('ok');}
        }}
      );
      expect(modal.opened).toBeResolvedWith(true);
    });

    it('should expose a promise linked to the templateUrl / resolve promises and reject it if needed', function() {
      var modal = open({template: '<div>Content</div>', resolve: {
        ok: function() {return $q.reject('ko');}
      }}, true);
      expect(modal.opened).toBeRejectedWith('ko');
    });

    it('should focus on the element that has autofocus attribute when the modal is open/reopen and the animations have finished', function() {
      function openAndCloseModalWithAutofocusElement() {
        var modal = open({template: '<div><input type="text" id="auto-focus-element" autofocus></div>'});
        $animate.flush();
        $rootScope.$digest();
        expect(angular.element('#auto-focus-element')).toHaveFocus();

        close(modal, 'closed ok');

        expect(modal.result).toBeResolvedWith('closed ok');
      }

      openAndCloseModalWithAutofocusElement();
      openAndCloseModalWithAutofocusElement();
    });

    it('should not focus on the element that has autofocus attribute when the modal is opened and something in the modal already has focus and the animations have finished', function() {
      function openAndCloseModalWithAutofocusElement() {

        var modal = open({template: '<div><input type="text" id="auto-focus-element" autofocus><input type="text" id="pre-focus-element" focus-me></div>'});
        $animate.flush();
        $rootScope.$digest();
        expect(angular.element('#auto-focus-element')).not.toHaveFocus();
        expect(angular.element('#pre-focus-element')).toHaveFocus();

        close(modal, 'closed ok');

        expect(modal.result).toBeResolvedWith('closed ok');
      }

      openAndCloseModalWithAutofocusElement();
      openAndCloseModalWithAutofocusElement();
    });

    it('should wait until the in animation is finished before attempting to focus the modal or autofocus element', function() {
      function openAndCloseModalWithAutofocusElement() {
        var modal = open({template: '<div><input type="text" id="auto-focus-element" autofocus></div>'});
        expect(angular.element('#auto-focus-element')).not.toHaveFocus();

        $animate.flush();
        $rootScope.$digest();

        expect(angular.element('#auto-focus-element')).toHaveFocus();

        close(modal, 'closed ok');

        expect(modal.result).toBeResolvedWith('closed ok');
      }

      function openAndCloseModalWithOutAutofocusElement() {
        var link = '<a href>Link</a>';
        var element = angular.element(link);
        angular.element(document.body).append(element);
        element.focus();
        expect(document.activeElement.tagName).toBe('A');

        var modal = open({template: '<div><input type="text"></div>'});
        expect(document.activeElement.tagName).toBe('A');

        $animate.flush();
        $rootScope.$digest();

        expect(document.activeElement.tagName).toBe('DIV');

        close(modal, 'closed ok');

        expect(modal.result).toBeResolvedWith('closed ok');
      }

      openAndCloseModalWithAutofocusElement();
      openAndCloseModalWithOutAutofocusElement();
    });

    it('should change focus to first element when tab key was pressed', function() {
      var initialPage = angular.element('<a href="#" id="cannot-get-focus-from-modal">Outland link</a>');
      angular.element(document.body).append(initialPage);
      initialPage.focus();

      open({
        template:'<a href="#" id="tab-focus-link"><input type="text" id="tab-focus-input1"/><input type="text" id="tab-focus-input2"/>' +
        '<button id="tab-focus-button">Open me!</button>'
      });
      expect($document).toHaveModalsOpen(1);

      var lastElement = angular.element(document.getElementById('tab-focus-button'));
      lastElement.focus();
      triggerKeyDown(lastElement, 9);
      expect(document.activeElement.getAttribute('id')).toBe('tab-focus-link');

      initialPage.remove();
    });

    it('should change focus to last element when shift+tab key is pressed', function() {
      var initialPage = angular.element('<a href="#" id="cannot-get-focus-from-modal">Outland link</a>');
      angular.element(document.body).append(initialPage);
      initialPage.focus();

      open({
        template:'<a href="#" id="tab-focus-link"><input type="text" id="tab-focus-input1"/><input type="text" id="tab-focus-input2"/>' +
        '<button id="tab-focus-button">Open me!</button>'
      });
      expect($document).toHaveModalsOpen(1);

      var lastElement = angular.element(document.getElementById('tab-focus-link'));
      lastElement.focus();
      triggerKeyDown(lastElement, 9, true);
      expect(document.activeElement.getAttribute('id')).toBe('tab-focus-button');

      initialPage.remove();
    });

    it('should change focus to first element when tab key is pressed when keyboard is false', function() {
      var initialPage = angular.element('<a href="#" id="cannot-get-focus-from-modal">Outland link</a>');
      angular.element(document.body).append(initialPage);
      initialPage.focus();

      open({
        template:'<a href="#" id="tab-focus-link"><input type="text" id="tab-focus-input1"/><input type="text" id="tab-focus-input2"/>' +
        '<button id="tab-focus-button">Open me!</button>',
        keyboard: false
      });
      expect($document).toHaveModalsOpen(1);

      var lastElement = angular.element(document.getElementById('tab-focus-button'));
      lastElement.focus();
      triggerKeyDown(lastElement, 9);
      expect(document.activeElement.getAttribute('id')).toBe('tab-focus-link');

      initialPage.remove();
    });

    it('should change focus to last element when shift+tab keys are pressed when keyboard is false', function() {
      var initialPage = angular.element('<a href="#" id="cannot-get-focus-from-modal">Outland link</a>');
      angular.element(document.body).append(initialPage);
      initialPage.focus();

      open({
        template:'<a href="#" id="tab-focus-link"><input type="text" id="tab-focus-input1"/><input type="text" id="tab-focus-input2"/>' +
        '<button id="tab-focus-button">Open me!</button>',
        keyboard: false
      });
      expect($document).toHaveModalsOpen(1);

      var lastElement = angular.element(document.getElementById('tab-focus-link'));
      lastElement.focus();
      triggerKeyDown(lastElement, 9, true);
      expect(document.activeElement.getAttribute('id')).toBe('tab-focus-button');

      initialPage.remove();
    });
  });

  describe('default options can be changed in a provider', function() {
    it('should allow overriding default options in a provider', function() {
      $uibModalProvider.options.backdrop = false;
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).not.toHaveBackdrop();
    });

    it('should accept new objects with default options in a provider', function() {
      $uibModalProvider.options = {
        backdrop: false
      };
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).not.toHaveBackdrop();
    });
  });

  describe('option by option', function () {
    describe('template and templateUrl', function () {
      it('should throw an error if none of template and templateUrl are provided', function() {
        expect(function(){
          var modal = open({});
        }).toThrow(new Error('One of template or templateUrl options is required.'));
      });

      it('should not fail if a templateUrl contains leading / trailing white spaces', function() {

        $templateCache.put('whitespace.html', '  <div>Whitespaces</div>  ');
        open({templateUrl: 'whitespace.html'});
        expect($document).toHaveModalOpenWithContent('Whitespaces', 'div');
      });

      it('should accept template as a function', function() {
        open({template: function() {
          return '<div>From a function</div>';
        }});

        expect($document).toHaveModalOpenWithContent('From a function', 'div');
      });

      it('should not fail if a templateUrl as a function', function() {

        $templateCache.put('whitespace.html', '  <div>Whitespaces</div>  ');
        open({templateUrl: function() {
          return 'whitespace.html';
        }});
        expect($document).toHaveModalOpenWithContent('Whitespaces', 'div');
      });
    });

    describe('controller', function() {
      it('should accept controllers and inject modal instances', function() {
        var TestCtrl = function($scope, $uibModalInstance) {
          $scope.fromCtrl = 'Content from ctrl';
          $scope.isModalInstance = angular.isObject($uibModalInstance) && angular.isFunction($uibModalInstance.close);
        };

        open({template: '<div>{{fromCtrl}} {{isModalInstance}}</div>', controller: TestCtrl});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should accept controllerAs alias', function() {
        $controllerProvider.register('TestCtrl', function($uibModalInstance) {
          this.fromCtrl = 'Content from ctrl';
          this.isModalInstance = angular.isObject($uibModalInstance) && angular.isFunction($uibModalInstance.close);
        });

        open({template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>', controller: 'TestCtrl as test'});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should respect the controllerAs property as an alternative for the controller-as syntax', function() {
        $controllerProvider.register('TestCtrl', function($uibModalInstance) {
          this.fromCtrl = 'Content from ctrl';
          this.isModalInstance = angular.isObject($uibModalInstance) && angular.isFunction($uibModalInstance.close);
        });

        open({template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>', controller: 'TestCtrl', controllerAs: 'test'});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should allow defining in-place controller-as controllers', function() {
        open({template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>', controller: function($uibModalInstance) {
          this.fromCtrl = 'Content from ctrl';
          this.isModalInstance = angular.isObject($uibModalInstance) && angular.isFunction($uibModalInstance.close);
        }, controllerAs: 'test'});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should allow usage of bindToController', function() {
        open({template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>', controller: function($uibModalInstance) {
          this.fromCtrl = 'Content from ctrl';
          this.isModalInstance = angular.isObject($uibModalInstance) && angular.isFunction($uibModalInstance.close);
        }, controllerAs: 'test', bindToController: true});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });
    });

    describe('resolve', function() {
      var ExposeCtrl = function($scope, value) {
        $scope.value = value;
      };

      function modalDefinition(template, resolve) {
        return {
          template: template,
          controller: ExposeCtrl,
          resolve: resolve
        };
      }

      it('should resolve simple values', function() {
        open(modalDefinition('<div>{{value}}</div>', {
          value: function() {
            return 'Content from resolve';
          }
        }));

        expect($document).toHaveModalOpenWithContent('Content from resolve', 'div');
      });

      it('should resolve string references to injectables', function() {
        open({
          controller: function($scope, $foo) {
            $scope.value = 'Content from resolve';
            expect($foo).toBe($uibModal);
          },
          resolve: {
            $foo: '$uibModal'
          },
          template: '<div>{{value}}</div>'
        });

        expect($document).toHaveModalOpenWithContent('Content from resolve', 'div');
      });

      it('should resolve promises as promises', function() {
        open({
          controller: function($scope, $foo) {
            $scope.value = 'Content from resolve';
            expect($foo).toBe('bar');
          },
          resolve: {
            $foo: $q.when('bar')
          },
          template: '<div>{{value}}</div>'
        });
      });

      it('should delay showing modal if one of the resolves is a promise', function() {
        open(modalDefinition('<div>{{value}}</div>', {
          value: function() {
            return $timeout(function() { return 'Promise'; }, 100);
          }
        }), true);
        expect($document).toHaveModalsOpen(0);

        $timeout.flush();
        $animate.flush();
        expect($document).toHaveModalOpenWithContent('Promise', 'div');
      });

      it('should not open dialog (and reject returned promise) if one of resolve fails', function() {
        var deferred = $q.defer();

        var modal = open(modalDefinition('<div>{{value}}</div>', {
          value: function() {
            return deferred.promise;
          }
        }), true);
        expect($document).toHaveModalsOpen(0);

        deferred.reject('error in test');
        $rootScope.$digest();

        expect($document).toHaveModalsOpen(0);
        expect(modal.result).toBeRejectedWith('error in test');
      });

      it('should support injection with minification-safe syntax in resolve functions', function() {
        open(modalDefinition('<div>{{value.id}}</div>', {
          value: ['$locale', function(e) {
            return e;
          }]
        }));

        expect($document).toHaveModalOpenWithContent('en-us', 'div');
      });
    });

    describe('scope', function() {
      it('should use custom scope if provided', function() {
        var $scope = $rootScope.$new();
        $scope.fromScope = 'Content from custom scope';
        open({
          template: '<div>{{fromScope}}</div>',
          scope: $scope
        });
        expect($document).toHaveModalOpenWithContent('Content from custom scope', 'div');
      });

      it('should create and use child of $rootScope if custom scope not provided', function() {
        var scopeTailBefore = $rootScope.$$childTail;

        $rootScope.fromScope = 'Content from root scope';
        open({
          template: '<div>{{fromScope}}</div>'
        });
        expect($document).toHaveModalOpenWithContent('Content from root scope', 'div');
      });
    });

    describe('keyboard', function () {
      it('should not close modals if keyboard option is set to false', function() {
        open({
          template: '<div>No keyboard</div>',
          keyboard: false
        });

        expect($document).toHaveModalsOpen(1);

        triggerKeyDown($document, 27);
        $rootScope.$digest();

        expect($document).toHaveModalsOpen(1);
      });
    });

    describe('backdrop', function() {
      it('should not have any backdrop element if backdrop set to false', function() {
        var modal = open({
          template: '<div>No backdrop</div>',
          backdrop: false
        });
        expect($document).toHaveModalOpenWithContent('No backdrop', 'div');
        expect($document).not.toHaveBackdrop();

        dismiss(modal);
        expect($document).toHaveModalsOpen(0);
      });

      it('should not close modal on backdrop click if backdrop is specified as "static"', function() {
        open({
          template: '<div>Static backdrop</div>',
          backdrop: 'static'
        });

        $document.find('body > div.modal-backdrop').click();
        $rootScope.$digest();

        expect($document).toHaveModalOpenWithContent('Static backdrop', 'div');
        expect($document).toHaveBackdrop();
      });

      it('should contain backdrop in classes on each modal opening', function() {
        var modal = open({ template: '<div>With backdrop</div>' });
        $animate.flush();
        var backdropEl = $document.find('body > div.modal-backdrop');
        expect(backdropEl).toHaveClass('in');

        dismiss(modal);

        modal = open({ template: '<div>With backdrop</div>' });
        $animate.flush();
        backdropEl = $document.find('body > div.modal-backdrop');
        expect(backdropEl).toHaveClass('in');

      });

      describe('custom backdrop classes', function () {
        it('should support additional backdrop class as string', function() {
          open({
            template: '<div>With custom backdrop class</div>',
            backdropClass: 'additional'
          });

          expect($document.find('div.modal-backdrop')).toHaveClass('additional');
        });
      });
    });

    describe('custom window classes', function() {
      it('should support additional window class as string', function() {
        open({
          template: '<div>With custom window class</div>',
          windowClass: 'additional'
        });

        expect($document.find('div.modal')).toHaveClass('additional');
      });
    });

    describe('top window class', function () {
      it('should support top class option', function () {
        open({
          template: '<div>With custom window top class</div>',
          windowTopClass: 'top-class'
        });

        expect($document.find('div.modal')).toHaveClass('top-class');
      });
    });

    describe('size', function() {
      it('should support creating small modal dialogs', function() {
        open({
          template: '<div>Small modal dialog</div>',
          size: 'sm'
        });

        expect($document.find('div.modal-dialog')).toHaveClass('modal-sm');
      });

      it('should support creating large modal dialogs', function() {
        open({
          template: '<div>Large modal dialog</div>',
          size: 'lg'
        });

        expect($document.find('div.modal-dialog')).toHaveClass('modal-lg');
      });

      it('should support custom size modal dialogs', function() {
        open({
          template: '<div>Large modal dialog</div>',
          size: 'custom'
        });

        expect($document.find('div.modal-dialog')).toHaveClass('modal-custom');
      });
    });

    describe('animation', function() {
      it('should have animation fade classes by default', function() {
        open({
          template: '<div>Small modal dialog</div>'
        });

        expect($document.find('.modal')).toHaveClass('fade');
        expect($document.find('.modal-backdrop')).toHaveClass('fade');
      });

      it('should not have fade classes if animation false', function() {
        open({
          template: '<div>Small modal dialog</div>',
          animation: false
        });

        expect($document.find('.modal')).not.toHaveClass('fade');
        expect($document.find('.modal-backdrop')).not.toHaveClass('fade');
      });
    });

    describe('appendTo', function() {
      it('should be added to body by default', function() {
        var modal = open({template: '<div>Content</div>'});

        expect($document).toHaveModalsOpen(1);
        expect($document).toHaveModalOpenWithContent('Content', 'div');
      });

      it('should not be added to body if appendTo is passed', function() {
        var element = angular.element('<section>Some content</section>');
        angular.element(document.body).append(element);

        var modal = open({template: '<div>Content</div>', appendTo: element});

        expect($document).not.toHaveModalOpenWithContent('Content', 'div');
      });

      it('should be added to appendTo element if appendTo is passed', function() {
        var element = angular.element('<section>Some content</section>');
        angular.element(document.body).append(element);

        expect($document.find('section').children('div.modal').length).toBe(0);
        open({template: '<div>Content</div>', appendTo: element});
        expect($document.find('section').children('div.modal').length).toBe(1);

        element.remove();
      });

      it('should throw error if appendTo element is not found', function() {
        expect(function(){
          open({template: '<div>Content</div>', appendTo: $document.find('aside')});
        }).toThrow(new Error('appendTo element not found. Make sure that the element passed is in DOM.'));
      });

      it('should be removed from appendTo element when dismissed', function() {
        var modal = open({template: '<div>Content</div>'});

        expect($document).toHaveModalsOpen(1);

        dismiss(modal);
        expect($document).toHaveModalsOpen(0);
      });

      it('should allow requiring parent directive from appendTo target', function() {
        var element = $compile('<section parent-directive>Some content</section>')($rootScope);
        angular.element(document.body).append(element);

        open({template: '<div child-directive>{{text}}</div>', appendTo: element});
        $animate.flush();
        expect($document.find('[child-directive]').text()).toBe('foo');

        element.remove();
      });
    });

    describe('openedClass', function() {
      var body;

      beforeEach(function() {
        body = $document.find('body');
      });

      it('should add the modal-open class to the body element by default', function() {
        open({
          template: '<div>dummy modal</div>'
        });

        $animate.flush();

        expect(body).toHaveClass('modal-open');
      });

      it('should add the custom class to the body element', function() {
        open({
          template: '<div>dummy modal</div>',
          openedClass: 'foo'
        });

        $animate.flush();

        expect(body).toHaveClass('foo');
        expect(body).not.toHaveClass('modal-open');
      });

      it('should remove the custom class on closing of modal', function() {
        var modal = open({
          template: '<div>dummy modal</div>',
          openedClass: 'foo'
        });

        $animate.flush();

        expect(body).toHaveClass('foo');

        close(modal);

        expect(body).not.toHaveClass('foo');
      });

      it('should add multiple custom classes to the body element and remove appropriately', function() {
        var modal1 = open({
          template: '<div>dummy modal</div>',
          openedClass: 'foo'
        });

        $animate.flush();

        expect(body).toHaveClass('foo');
        expect(body).not.toHaveClass('modal-open');

        var modal2 = open({
          template: '<div>dummy modal</div>',
          openedClass: 'bar'
        });

        $animate.flush();

        expect(body).toHaveClass('foo');
        expect(body).toHaveClass('bar');
        expect(body).not.toHaveClass('modal-open');

        var modal3 = open({
          template: '<div>dummy modal</div>',
          openedClass: 'foo'
        });

        $animate.flush();

        expect(body).toHaveClass('foo');
        expect(body).toHaveClass('bar');
        expect(body).not.toHaveClass('modal-open');

        close(modal1);

        expect(body).toHaveClass('foo');
        expect(body).toHaveClass('bar');
        expect(body).not.toHaveClass('modal-open');

        close(modal2);

        expect(body).toHaveClass('foo');
        expect(body).not.toHaveClass('bar');
        expect(body).not.toHaveClass('modal-open');

        close(modal3);

        expect(body).not.toHaveClass('foo');
        expect(body).not.toHaveClass('bar');
        expect(body).not.toHaveClass('modal-open');
      });
    });
  });

  describe('multiple modals', function() {
    it('it should allow opening of multiple modals', function() {
      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>'});
      expect($document).toHaveModalsOpen(2);

      dismiss(modal2);
      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Modal1', 'div');

      dismiss(modal1);
      expect($document).toHaveModalsOpen(0);
    });

    it('should not close any modals on ESC if the topmost one does not allow it', function() {
      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>', keyboard: false});

      triggerKeyDown($document, 27);
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(2);
    });

    it('should not close any modals on click if a topmost modal does not have backdrop', function() {
      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>', backdrop: false});

      $document.find('body > div.modal-backdrop').click();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(2);
    });

    it('should not interfere with default options', function() {
      var modal1 = open({template: '<div>Modal1</div>', backdrop: false});
      var modal2 = open({template: '<div>Modal2</div>'});
      $rootScope.$digest();

      expect($document).toHaveBackdrop();
    });

    it('should add "modal-open" class when a modal gets opened', function() {
      var body = $document.find('body');
      expect(body).not.toHaveClass('modal-open');

      var modal1 = open({template: '<div>Content1</div>'});
      $animate.flush();
      expect(body).toHaveClass('modal-open');

      var modal2 = open({template: '<div>Content1</div>'});
      $animate.flush();
      expect(body).toHaveClass('modal-open');

      dismiss(modal1);
      expect(body).toHaveClass('modal-open');

      dismiss(modal2);
      expect(body).not.toHaveClass('modal-open');
    });

    it('should return to the element which had focus before the dialog is invoked', function() {
      var link = '<a href>Link</a>';
      var element = angular.element(link);
      angular.element(document.body).append(element);
      element.focus();
      expect(document.activeElement.tagName).toBe('A');

      var modal1 = open({template: '<div>Modal1<button id="focus">inside modal1</button></div>'});
      $animate.flush();
      $rootScope.$digest();
      document.getElementById('focus').focus();
      expect(document.activeElement.tagName).toBe('BUTTON');
      expect($document).toHaveModalsOpen(1);

      var modal2 = open({template: '<div>Modal2</div>'});
      $animate.flush();
      $rootScope.$digest();
      expect(document.activeElement.tagName).toBe('DIV');
      expect($document).toHaveModalsOpen(2);

      dismiss(modal2);
      expect(document.activeElement.tagName).toBe('BUTTON');
      expect($document).toHaveModalsOpen(1);

      dismiss(modal1);
      expect(document.activeElement.tagName).toBe('A');
      expect($document).toHaveModalsOpen(0);

      element.remove();
    });

    it('should open modals and resolve the opened promises in order', function() {
      // Opens a modal for each element in array order.
      // Order is an array of non-repeating integers from 0..length-1 representing when to resolve that modal's promise.
      // For example [1,2,0] would resolve the 3rd modal's promise first and the 2nd modal's promise last.
      // Tests that the modals are added to $uibModalStack and that each resolves its "opened" promise sequentially.
      // If an element is {reject:n} then n is still the order, but the corresponding promise is rejected.
      // A rejection earlier in the open sequence should not affect modals opened later.
      function test(order) {
        var ds = []; // {index, deferred, reject}
        var expected = ''; // 0..length-1
        var actual = '';
        angular.forEach(order, function(x, i) {
          var reject = x.reject !== undefined;
          if (reject) {
            x = x.reject;
          } else {
            expected += i;
          }
          ds[x] = {index: i, deferred: $q.defer(), reject: reject};

          var scope = $rootScope.$new();
          scope.index = i;
          open({
            template: '<div>' + i + '</div>',
            scope: scope,
            resolve: {
              x: function() { return ds[x].deferred.promise; }
            }
          }, true).opened.then(function() {
            expect($uibModalStack.getTop().value.modalScope.index).toEqual(i);
            actual += i;
          });
        });

        angular.forEach(ds, function(d, i) {
          if (d.reject) {
            d.deferred.reject('rejected:' + d.index);
          } else {
            d.deferred.resolve('resolved:' + d.index);
          }
          $rootScope.$digest();
        });

        expect(actual).toEqual(expected);
        expect($uibModal.getPromiseChain()).toEqual(null);
      }

      // Calls emit n! times on arrays of length n containing all non-repeating permutations of the integers 0..n-1.
      function permute(n, emit) {
        if (n < 1 || typeof emit !== 'function') {
          return;
        }
        var a = [];
        function _permute(depth) {
          index: for (var i = 0; i < n; i++) {
            for (var j = 0; j < depth; j++) {
              if (a[j] === i) {
                continue index; // already used
              }
            }

            a[depth] = i;
            if (depth + 1 === n) {
              emit(angular.copy(a));
            } else {
              _permute(depth + 1);
            }
          }
        }
        _permute(0);
      }

      permute(2, function(a) {
        test(a);
      });
      permute(2, function(a) {
        test(a.map(function(x, i) {
          return {reject:x};
        }));
      });
      permute(2, function(a) {
        test(a.map(function(x, i) {
          return i === 0 ? {reject: x} : x;
        }));
      });
      permute(3, function(a) {
        test(a);
      });
      permute(3, function(a) {
        test(a.map(function(x, i) {
          return {reject: x};
        }));
      });
      permute(3, function(a) {
        test(a.map(function(x, i) {
          return i === 0 ? {reject: x} : x;
        }));
      });
      permute(3, function(a) {
        test(a.map(function(x, i) {
          return i === 1 ? {reject: x} : x;
        }));
      });

      $animate.flush();
    });

    it('should have top class only on top window', function () {
      var modal1 = open({template: '<div>Content1</div>', windowClass: 'modal1', windowTopClass: 'modal-top'});
      expect($document.find('div.modal1')).toHaveClass('modal-top');
      expect($document).toHaveModalsOpen(1);

      var modal2 = open({template: '<div>Content1</div>', windowClass: 'modal2', windowTopClass: 'modal-top'});
      expect($document.find('div.modal1')).not.toHaveClass('modal-top');
      expect($document.find('div.modal2')).toHaveClass('modal-top');
      expect($document).toHaveModalsOpen(2);

      var modal3 = open({template: '<div>Content1</div>', windowClass: 'modal3', windowTopClass: 'modal-top'});
      expect($document.find('div.modal1')).not.toHaveClass('modal-top');
      expect($document.find('div.modal2')).not.toHaveClass('modal-top');
      expect($document.find('div.modal3')).toHaveClass('modal-top');
      expect($document).toHaveModalsOpen(3);

      dismiss(modal2);
      expect($document.find('div.modal1')).not.toHaveClass('modal-top');
      expect($document.find('div.modal3')).toHaveClass('modal-top');
      expect($document).toHaveModalsOpen(2);

      close(modal3);
      expect($document.find('div.modal1')).toHaveClass('modal-top');
      expect($document).toHaveModalsOpen(1);
    });
  });

  describe('modal.closing event', function() {
    it('should close the modal contingent on the modal.closing event and return whether the modal closed', function() {
      var preventDefault;
      var modal;
      var template = '<div>content</div>';

      function TestCtrl($scope) {
        $scope.$on('modal.closing', function(event, resultOrReason, closing) {
          if (preventDefault) {
            event.preventDefault();
          }
        });
      }

      modal = open({template: template, controller: TestCtrl});

      preventDefault = true;
      expect(close(modal, 'result', true)).toBeFalsy();
      expect($document).toHaveModalsOpen(1);

      preventDefault = false;
      expect(close(modal, 'result')).toBeTruthy();
      expect($document).toHaveModalsOpen(0);

      modal = open({template: template, controller: TestCtrl});

      preventDefault = true;
      expect(dismiss(modal, 'result', true)).toBeFalsy();
      expect($document).toHaveModalsOpen(1);

      preventDefault = false;
      expect(dismiss(modal, 'result')).toBeTruthy();
      expect($document).toHaveModalsOpen(0);
    });

    it('should trigger modal.closing and pass result/reason and closing parameters to the event', function() {
      var called;

      called = false;

      close(open({
        template: '<div>content</div>',
        controller: function($scope) {
          $scope.$on('modal.closing', function(event, resultOrReason, closing) {
            called = true;
            expect(resultOrReason).toBe('result');
            expect(closing).toBeTruthy();
          });
        }
      }), 'result');
      expect(called).toBeTruthy();

      called = false;
      dismiss(open({
        template: '<div>content</div>',
        controller: function($scope) {
          $scope.$on('modal.closing', function(event, resultOrReason, closing) {
            called = true;
            expect(resultOrReason).toBe('reason');
            expect(closing).toBeFalsy();
          });
        }
      }), 'reason');
      expect(called).toBeTruthy();
    });
  });
});
