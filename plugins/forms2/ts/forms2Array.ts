/// <reference path="forms2Plugin.ts"/>
module HawtioForms {
  var directiveName = "hawtioForms2Array";

  function clearBody(context, table) {
    var body = table.find('tbody');
    body.empty();
    return body;
  }

  function buildTableBody(context, columnSchema, entity, body) {
    _.forEach(entity, (row, index) => {
      var tr = newBodyRow(context);
      if (columnSchema.properties.$items) {
        tr.append('<td>' + row + '</td>');
      } else {
        _.forIn(columnSchema.properties, (control, name) => {
          var tmpConfig = <FormConfiguration>{
            style: FormStyle.UNWRAPPED, 
            mode: FormMode.VIEW, 
            properties: {
            
            }
          };
          tmpConfig.properties[name] = control;
          var template = getTemplate(context, tmpConfig, name, control);
          if (template) {
            var el = angular.element(template);
            el.attr({
              'class': ''
            });
            el.find('label').text('');
            ['input', 'select'].forEach((controlType) => {
              el.find(controlType).attr({
                'ng-disabled': 'true',
                'style': 'width: auto'
              }).removeClass('form-control')
                .addClass('table-control');
            });
            if (control.enum) {
              addPostInterpolateAction(context, name, (el) => {
                var select = el.find('select');
                var propName = 'config.columnSchema.properties[\'' + name + '\'].enum';
                setSelectOptions(_.isArray(control.enum), propName, select);
              });
            }
            if ('properties' in control || 'javaType' in control) {
              addPostInterpolateAction(context, name, (el) => {
                el.find('h4').remove();
                el.find('.inline-object').attr({
                  'entity': 'entity[' + index + '].' + name,
                  'label': false
                });
              });
            }
            template = interpolateTemplate(context, tmpConfig, name, control, el.prop('outerHTML'), 'entity[' + index + '].' + name);
            var td = angular.element('<td></td>');
            td.append(template);
            tr.append(td); 
          } else {
            tr.append('<td>' + row[name] + '</td>');
          }
        });
      }
      var deleteRow = angular.element(context.$templateCache.get('deleteRow.html'));
      deleteRow.find('.deleteRow').attr({
        'ng-click': 'deleteRow(' + index + ')'
      });
      deleteRow.find('.editRow').attr({
        'ng-click': 'editRow(' + index + ')'
      });
      tr.append(deleteRow);
      body.append(tr);
    });
  }

  function newBodyRow(context) {
    return angular.element(context.$templateCache.get('rowTemplate.html'));
  }

  function newHeaderRow(context, table) {
    var header = table.find('thead');
    header.empty();
    return header.append(context.$templateCache.get('rowTemplate.html')).find('tr');
  }

  function buildTableHeader(context, table, columnSchema) {
    var headerRow = newHeaderRow(context, table);
    _.forIn(columnSchema.properties, (control, name) => {
      var interpolateFunc = context.$interpolate(control.headerTemplate || context.$templateCache.get('header.html'));
      headerRow.append(interpolateFunc({
        control: control,
        name: context.maybeHumanize(name)
        }));
    });
    headerRow.append(context.$templateCache.get("newItemHeader.html"));
    return headerRow;
  }

  _module.directive(directiveName, ['$compile', '$templateCache', '$interpolate', 'SchemaRegistry', 'ControlMappingRegistry', '$modal', ($compile, $templateCache, $interpolate, schemas:SchemaRegistry, mappings:ControlMappingRegistry, $modal) => {
    return {
      restrict: 'A',
      replace: true,
      templateUrl: UrlHelpers.join(templatePath, 'forms2Array.html'),
      scope: {
        config: '=' + directiveName,
        entity: '=?'
      },
      link: (scope, element, attrs) => {
        scope.$watch('config', (newConfig) => {
          var context = {
            postInterpolateActions: {

            },
            maybeHumanize: undefined,
            config: undefined,
            element: element,
            attrs: attrs,
            mappings: mappings,
            schemas: schemas,
              $templateCache: $templateCache,
              $interpolate: $interpolate,
                $compile: $compile,
            directiveName: directiveName        
          };
          var config = <any> initConfig(context, _.cloneDeep(newConfig), false);
          context.config = config;
          context.maybeHumanize = createMaybeHumanize(context);
          if (!scope.entity) {
            scope.entity = [];
          }
          if (!config || !config.items) {
            return;
          }
          var type = config.items.type || config.items.javaType;
          var entity = scope.entity;
          var columnSchema = <any> {
            properties: {

            }
          }
          if (mappings.hasMapping(type)) {
            var items = <any>{}
            _.merge(items, config, {
              type: mappings.getMapping(type)
            });
            if ('items' in items) {
              delete items['items'];
            }
            if (!items.label) {
              items.label = 'Entries';
            }
            columnSchema.properties.$items = items;
          } else {
            columnSchema = schemas.getSchema(type);
          }
          var table = angular.element($templateCache.get("table.html"));
          var header = buildTableHeader(context, table, columnSchema);
          var s = scope.$new();

          config.columnSchema = columnSchema;

          s.config = config;
          s.entity = entity;

          function initSchema(schema) {
            var answer = _.clone(schema, true);
            answer.style = FormStyle.STANDARD;
            if ('$items' in answer.properties) {
              answer.properties.$items['label-attributes'] = {
                'style': 'display: none'
              };
            }
            return answer;
          }

          s.deleteRow = (index) => {
            var modal = $modal.open({
              templateUrl: UrlHelpers.join(templatePath, 'arrayItemModal.html'),
              controller: ['$scope', '$modalInstance', ($scope, $modalInstance) => {
                $scope.schema = initSchema(columnSchema);
                $scope.schema.mode = FormMode.VIEW;
                $scope.header = "Delete Entry?";
                $scope.description = "<p>Are you sure you want to delete the following entry?</p><p><strong>This operation cannot be undone!</strong></p>";
                if (columnSchema.properties.$items) {
                  $scope.newEntity = {
                    $items: entity[index]
                  };
                } else {
                  $scope.newEntity = _.clone(entity[index]);
                }
                $scope.ok = () => {
                  modal.close();
                  entity.splice(index, 1);
                }
                $scope.cancel = () => {
                  modal.dismiss();
                }
              }]
            });
          }

          s.editRow = (index) => {
            var modal = $modal.open({
              templateUrl: UrlHelpers.join(templatePath, 'arrayItemModal.html'),
              controller: ['$scope', '$modalInstance', ($scope, $modalInstance) => {
                $scope.schema = initSchema(columnSchema);
                $scope.header = "Edit Entry";
                if (columnSchema.properties.$items) {
                  $scope.newEntity = {
                    $items: entity[index]
                  };
                } else {
                  $scope.newEntity = _.clone(entity[index]);
                }
                $scope.ok = () => {
                  modal.close();
                  if ('$items' in $scope.newEntity) {
                    entity[index] = $scope.newEntity.$items;
                  } else {
                    entity[index] = $scope.newEntity;
                  }
                }
                $scope.cancel = () => {
                  modal.dismiss();
                }
              }]
            });
          }

          s.createNewRow = () => {
            var modal = $modal.open({
              templateUrl: UrlHelpers.join(templatePath, 'arrayItemModal.html'),
              controller: ['$scope', '$modalInstance', ($scope, $modalInstance) => {
                $scope.schema = initSchema(columnSchema);
                $scope.newEntity = undefined;
                $scope.header = "Add New Entry";
                $scope.ok = () => {
                  modal.close();
                  if ('$items' in $scope.newEntity) {
                    entity.push($scope.newEntity.$items);
                  } else {
                    entity.push($scope.newEntity);
                  }
                }
                $scope.cancel = () => {
                  modal.dismiss();
                }
              }]
            });
          }
          s.watch = s.$watchCollection('entity', (entity, old) => {
            scope.entity = entity;
            var body = clearBody(context, table);
            var tmp = angular.element('<div></div>');
            buildTableBody(context, columnSchema, entity, tmp);
            body.append($compile(tmp.children())(s));
          });
          element.append($compile(table)(s));
        }, true);

      }
    }

  }]);

}
