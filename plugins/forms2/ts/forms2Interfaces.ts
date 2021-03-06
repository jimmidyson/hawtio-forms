/// <reference path="../../includes.ts"/>
module HawtioForms {
  /*
   * Map of name/value pairs that get mapped to element attributes
   */
  export interface AttributeMap {
    [key:string]: string;
  }

  /**
   * Element in a FormConfiguration's 'properties' attribute
   */
  export interface FormElement {
    type: string;
    tooltip?: string;
    label?: string;
    hidden?: boolean;
    javaType?: string;
    enum?: any;
    items?: any;
    'input-attributes'?: AttributeMap;
    'control-group-attributes'?: AttributeMap;
    'label-attributes'?: AttributeMap;
    formTemplate?: string;
  }

  /**
   * Type for the FormConfiguration's 'properties' attribute
   */
  export interface FormProperties {
    [name:string]: FormElement;
  }

  /**
   * Type for the FormConfiguration's 'tabs' attribute
   */
  export interface FormTabs {
    [name:string]: Array<string>;
  }

  /**
   * Enum for form mode attribute
   */
  export enum FormMode {
    VIEW,
    EDIT
  }

  /**
   * Enum for the overall form style
   */
  export enum FormStyle {
    STANDARD,
    INLINE,
    HORIZONTAL,
    UNWRAPPED
  }

  export interface FormWizardPage {
    title?: string;
    controls: Array<string>;
  }

  export interface FormWizardPages {
    pages: FormWizardPage;
  }

  /**
   * Interface that describes the configuration object for hawtio forms
   */
  export interface FormConfiguration {
    id?: string;
    type?: string;
    mode?: FormMode;
    style?: FormStyle;
    disableHumanizeLabel?: boolean
    ignorePrefixInLabel?: boolean
    properties: FormProperties;
    tabs?: FormTabs;
    wizard?: FormWizardPages;
    controls?: Array<string>;
    label?: string;
  }

  export function createFormConfiguration(options?: FormConfiguration):FormConfiguration {
    var answer = options || { properties: {} };
    _.defaults(answer, {
      style: FormStyle.HORIZONTAL,
      mode: FormMode.EDIT
    });
    return answer;
  }

  export interface ControlMappingRegistry {
    hasMapping(name: string):boolean;
    addMapping(name: string, controlType: string);
    getMapping(name: string):string;
    removeMapping(name: string):string;
    iterate(iter:(controlType:string, name:string) => void);
  }

  export interface SchemaRegistry {
    addSchema(name: string, schema: FormConfiguration);
    getSchema(name:string):FormConfiguration;
    cloneSchema(name:string):FormConfiguration;
    removeSchema(name:string):FormConfiguration;
    iterate(iter:(FormConfiguration, string) => void);
    addListener(name: string, callback: (nme:string, schema: any) => void);
    removeListener(name: string);
  }
}
