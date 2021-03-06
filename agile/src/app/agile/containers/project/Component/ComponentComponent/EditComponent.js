import React, { Component } from 'react';
import { Modal, Form, Input, Select, message } from 'choerodon-ui';
import { Content, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import UserHead from '../../../../components/UserHead';
import { getUsers, getUser } from '../../../../api/CommonApi';
import { loadComponent, updateComponent } from '../../../../api/ComponentApi';
import './component.scss';

const { Sidebar } = Modal;
const { TextArea } = Input;
const { Option } = Select;
const { AppState } = stores;
const FormItem = Form.Item;
let sign = false;

class EditComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      originUsers: [],
      selectLoading: false,
      createLoading: false,

      component: {},
      defaultAssigneeRole: undefined,
      description: undefined,
      managerId: undefined,
      name: undefined,
    };
  }

  componentDidMount() {
    this.loadComponent(this.props.componentId);
  }

  onFilterChange(input) {
    if (!sign) {
      this.setState({
        selectLoading: true,
      });
      getUsers(input).then((res) => {
        this.setState({
          originUsers: res.content,
          selectLoading: false,
        });
      });
      sign = true;
    } else {
      this.debounceFilterIssues(input);
    }
  }

  debounceFilterIssues = _.debounce((input) => {
    this.setState({
      selectLoading: true,
    });
    getUsers(input).then((res) => {
      this.setState({
        originUsers: res.content,
        selectLoading: false,
      });
    });
  }, 500);

  getFirst(str) {
    if (!str) {
      return '';
    }
    const re = /[\u4E00-\u9FA5]/g;
    for (let i = 0, len = str.length; i < len; i += 1) {
      if (re.test(str[i])) {
        return str[i];
      }
    }
    return str[0];
  }

  loadComponent(componentId) {
    loadComponent(componentId)
      .then((res) => {
        const { defaultAssigneeRole, description, managerId, name } = res;
        this.setState({
          defaultAssigneeRole,
          description,
          managerId: managerId || undefined,
          name,
          component: res,
        });
        if (managerId) {
          this.loadUser(managerId);
        }
      });
  }

  loadUser(managerId) {
    getUser(managerId).then((res) => {
      this.setState({
        managerId: JSON.stringify(res.content[0]),
        originUsers: [res.content[0]],
      });
    });
  }

  handleOk(e) {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { defaultAssigneeRole, description, managerId, name } = values;
        const component = {
          objectVersionNumber: this.state.component.objectVersionNumber,
          componentId: this.state.component.componentId,
          defaultAssigneeRole,
          description,
          managerId: managerId ? JSON.parse(managerId).id || 0 : 0,
          name,
        };
        this.setState({ createLoading: true });
        updateComponent(component.componentId, component)
          .then((res) => {
            this.setState({
              createLoading: false,
            });
            this.props.onOk();
          })
          .catch((error) => {
            this.setState({
              createLoading: false,
            });
            message.error('修改模块失败');
          });
      }
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Sidebar
        title="查看模块"
        onText="修改"
        cancelText="取消"
        visible={this.props.visible || false}
        confirmLoading={this.state.createLoading}
        onOk={this.handleOk.bind(this)}
        onCancel={this.props.onCancel.bind(this)}
      >
        <Content
          style={{
            padding: 0,
            width: 512,
          }}
          title={`在项目“${AppState.currentMenuType.name}”中查看模块`}
          description="请在下面输入模块名称、模块概要、负责人和默认经办人策略，修改模版。"
          link="http://v0-10.choerodon.io/zh/docs/user-guide/agile/component/"
        >
          <Form>
            <FormItem>
              {getFieldDecorator('name', {
                initialValue: this.state.name,
                rules: [{
                  required: true,
                  message: '模块名称必须',
                }],
              })(
                <Input label="模块名称" maxLength={30} />,
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('managerId', {
                initialValue: this.state.managerId,
              })(
                <Select
                  label="负责人"
                  loading={this.state.selectLoading}
                  allowClear
                  filter
                  onFilterChange={this.onFilterChange.bind(this)}
                >
                  {this.state.originUsers.map(user =>
                    (<Option key={JSON.stringify(user)} value={JSON.stringify(user)}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px' }}>
                        <UserHead
                          user={{
                            id: user.id,
                            loginName: user.loginName,
                            realName: user.realName,
                            avatar: user.imageUrl,
                          }}
                        />
                      </div>
                    </Option>),
                  )}
                </Select>,
              )}
            </FormItem>
            <FormItem style={{ marginBottom: 5 }}>
              {getFieldDecorator('description', {
                initialValue: this.state.description,
              })(
                <TextArea label="模块描述" autosize maxLength={30} />,
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('defaultAssigneeRole', {
                initialValue: this.state.defaultAssigneeRole,
                rules: [{
                  required: true,
                  message: '默认经办人必须',
                }],
              })(
                <Select label="默认经办人">
                  {['模块负责人', '无'].map(defaultAssigneeRole =>
                    (<Option key={defaultAssigneeRole} value={defaultAssigneeRole}>
                      {defaultAssigneeRole}
                    </Option>),
                  )}
                </Select>,
              )}
            </FormItem>
          </Form>
        </Content>
      </Sidebar>
    );
  }
}

export default Form.create()(EditComponent);
