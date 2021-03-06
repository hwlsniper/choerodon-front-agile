import React, { Component } from 'react';
import { observer } from 'mobx-react';
import {
  Button, Icon, DatePicker, Popover, Dropdown, Menu, Modal, Form, Select, Checkbox, Spin, 
} from 'choerodon-ui';
import {
  Page, Header, Content, stores, 
} from 'choerodon-front-boot';
import _ from 'lodash';
import moment from 'moment';
import ReactEcharts from 'echarts-for-react';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';
import AccumulationStore from '../../../../../stores/project/accumulation/AccumulationStore';
import AccumulationFilter from '../AccumulationComponent/AccumulationFilter';
import './AccumulationHome.scss';
import '../../BurndownChart/BurndownChartHome/BurndownChartHome.scss';
import txt from '../test';
import NoDataComponent from '../../Component/noData';
import pic from '../../../../../assets/image/emptyChart.svg';
import SwithChart from '../../Component/switchChart';

const { AppState } = stores;
const { RangePicker } = DatePicker;
const Option = Select.Option;
let backUrl;

@observer
class AccumulationHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeVisible: false,
      reportVisible: false,
      filterList: [],
      columnDatas: [],
      timeId: '',
      startDate: '',
      endDate: '',
      boardList: [],
      options: {},
      options2: {},
      optionsVisible: false,
      sprintData: {},
      loading: false,
      linkFromParamUrl: undefined,
    };
  }

  componentWillMount() {
    const { location: { search } } = this.props;
    const linkFromParamUrl = _.last(search.split('&')).split('=')[0] === 'paramUrl' ? _.last(search.split('&')).split('=')[1] : undefined;
    this.setState({
      linkFromParamUrl,
    });

    AccumulationStore.axiosGetFilterList().then((data) => {
      const newData = _.clone(data);
      for (let index = 0, len = newData.length; index < len; index += 1) {
        newData[index].check = false;
      }
      AccumulationStore.setFilterList(newData);
      ScrumBoardStore.axiosGetBoardList().then((res) => {
        const newData2 = _.clone(res);
        let newIndex;
        for (let index = 0, len = newData2.length; index < len; index += 1) {
          if (newData2[index].userDefault) {
            newData2[index].check = true;
            newIndex = index;
          } else {
            newData2[index].check = false;
          }
        }
        AccumulationStore.setBoardList(newData2);
        this.getColumnData(res[newIndex || 0].boardId, true);
      }).catch((error) => {
      });
      // this.getData();
    }).catch((error) => {
    });
  }

  GetRequest(url) {
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.split('?')[1];
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
      }
    }
    return theRequest;
  }

  getColumnData(id, type) {
    ScrumBoardStore.axiosGetBoardData(id, 0, false, []).then((res2) => {
      const data2 = res2.columnsData.columns;
      for (let index = 0, len = data2.length; index < len; index += 1) {
        data2[index].check = true;
      }
      this.setState({
        sprintData: res2.currentSprint,
      });
      AccumulationStore.setColumnData(data2);
      AccumulationStore.axiosGetProjectInfo().then((res) => {
        AccumulationStore.setProjectInfo(res);
        AccumulationStore.setStartDate(moment(res.creationDate.split(' ')[0]));
        if (type) {
          this.getData();
        }
      }).catch((error) => {
      });
    }).catch((error) => {
    });
  }

  getData() {
    this.setState({
      loading: true,
    });
    const columnData = AccumulationStore.getColumnData;
    const endDate = AccumulationStore.getEndDate.format('YYYY-MM-DD HH:mm:ss');
    const filterList = AccumulationStore.getFilterList;
    const startDate = AccumulationStore.getStartDate.format('YYYY-MM-DD HH:mm:ss');
    const columnIds = [];
    const quickFilterIds = [];
    let boardId;
    for (let index = 0, len = AccumulationStore.getBoardList.length; index < len; index += 1) {
      if (AccumulationStore.getBoardList[index].check) {
        boardId = AccumulationStore.getBoardList[index].boardId;
      }
    }
    for (let index2 = 0, len2 = columnData.length; index2 < len2; index2 += 1) {
      if (columnData[index2].check) {
        columnIds.push(columnData[index2].columnId);
      }
    }
    for (let index3 = 0, len3 = filterList.length; index3 < len3; index3 += 1) {
      if (filterList[index3].check) {
        quickFilterIds.push(filterList[index3].filterId);
      }
    }
    AccumulationStore.axiosGetAccumulationData({
      columnIds,
      endDate,
      quickFilterIds,
      startDate,
      boardId,
    }).then((res) => {
      AccumulationStore.setAccumulationData(res);
      this.setState({
        loading: false,
      });
      this.getOption();
    }).catch((error) => {
      this.setState({
        loading: false,
      });
    });
  }

  getOption() {
    let data = _.clone(AccumulationStore.getAccumulationData);
    const sorceColors = [];
    const colors = ['#743BE7', '#F953BA', '#4090FE', '#FF555', '#FFB100', '#00BFA5'];
    _.map(data, (item, index) => {
      if (sorceColors.includes(item.color)) {
        item.color = colors[index % 6];
      }
      sorceColors.push(item.color);
    });
    const legendData = [];
    for (let index = 0, len = data.length; index < len; index += 1) {
      legendData.push({
        icon: 'rect',
        name: data[index].name,
      });
    }
    let newxAxis = [];
    if (data.length > 0) {
      for (let index = 0, len = data.length; index < len; index += 1) {
        for (let index2 = 0, len2 = data[index].coordinateDTOList.length; index2 < len2; index2 += 1) {
          if (newxAxis.length === 0) {
            newxAxis.push(data[index].coordinateDTOList[index2].date.split(' ')[0]);
          } else if (newxAxis.indexOf(data[index].coordinateDTOList[index2].date.split(' ')[0]) === -1) {
            newxAxis.push(data[index].coordinateDTOList[index2].date.split(' ')[0]);
          }
        }
      }
    }
    newxAxis = (_.orderBy(newxAxis, item => new Date(item).getTime()));
    const legendSeries = [];
    data = data.reverse();
    for (let index = 0, len = data.length; index < len; index += 1) {
      legendSeries.push({
        name: data[index].name,
        type: 'line',
        stack: true,
        areaStyle: {
          normal: {
            color: data[index].color,
            opacity: 0.1,
          }, 
        },
        lineStyle: {
          normal: {
            color: data[index].color,
          }, 
        },
        itemStyle: {
          normal: { color: data[index].color },
        },
        data: [],
        symbol: 'circle',
      });
      for (let index2 = 0, len2 = newxAxis.length; index2 < len2; index2 += 1) {
        let date = '';
        let max = 0;
        let flag = 0;
        for (let index3 = 0, len3 = data[index].coordinateDTOList.length; index3 < len3; index3 += 1) {
          if (data[index].coordinateDTOList[index3].date.split(' ')[0] === newxAxis[index2]) {
            flag = 1;
            if (date === '') {
              date = data[index].coordinateDTOList[index3].date;
              max = data[index].coordinateDTOList[index3].issueCount;
            } else if (moment(data[index].coordinateDTOList[index3].date).isAfter(date)) {
              date = data[index].coordinateDTOList[index3].date;
              max = data[index].coordinateDTOList[index3].issueCount;
            }
          }
        }
        if (flag === 1) {
          legendSeries[index].data.push(max);
        } else {
          legendSeries[index].data.push(legendSeries[index].data[legendSeries[index].data.length - 1]);
        }
      }
    }
    this.setState({
      options: {
        tooltip: {
          trigger: 'axis',
          // axisPointer: {
          //   type: 'cross',
          //   label: {
          //     backgroundColor: '#6a7985',
          //   },
          // },
        },
        legend: {
          right: '90',
          data: legendData,
          top: '3%',
          itemGap: 30,
          itemWidth: 14,
          itemHeight: 14,
        },
        grid: {
          left: '50',
          right: '90',
          top: '8%',
          containLabel: true,
        },
        // toolbox: {
        //   left: 'left',
        //   feature: {
        //     restore: {},
        //     // dataZoom: {
        //     //   yAxisIndex: 'none',
        //     // },
        //   },
        // },
        xAxis: [
          {
            name: '日期',
            type: 'category',
            splitLine: {
              show: true,
              lineStyle: {
                // 使用深浅的间隔色
                color: 'rgba(116,59,231,0.10)',
                opacity: 0.9,
                // type: 'dashed',
              },
            },
            boundaryGap: false,
            data: newxAxis,
            axisLabel: {
              show: true,
              formatter(value, index) {
                // return `${value.split('-')[2]}/${MONTH[value.split('-')[1] * 1]}月`;
                return value.slice(5);
              },
            },
          },
        ],
        yAxis: [
          {
            splitLine: {
              show: true,
              lineStyle: {
                // 使用深浅的间隔色
                color: 'rgba(116,59,231,0.10)',
                opacity: 0.9,
                // type: 'dashed',
              },
            },
            name: '问题数',
            type: 'value',
            minInterval: 1,
          },
        ],
        series: legendSeries,
        dataZoom: [{
          startValue: newxAxis[0],
          type: 'slider',
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          // right: '50%',
          // left: '0%',
        }],
      },
      optionsVisible: false,
    });
  }

  getTimeType(data, type, array) {
    let result;
    if (array) {
      result = [];
    }
    for (let index = 0, len = data.length; index < len; index += 1) {
      if (data[index].check) {
        if (array) {
          result.push(String(data[index][type]));
        } else {
          result = data[index][type];
        }
      }
    }
    return result;
  }

  setStoreCheckData(data, id, params, array) {
    const newData = _.clone(data);
    for (let index = 0, len = newData.length; index < len; index += 1) {
      if (array) {
        if (id.indexOf(String(newData[index][params])) !== -1) {
          newData[index].check = true;
        } else {
          newData[index].check = false;
        }
      } else if (String(newData[index][params]) === String(id)) {
        newData[index].check = true;
      } else {
        newData[index].check = false;
      }
    }
    return newData;
  }

  getFilterData() {
    return [{
      data: AccumulationStore.getBoardList,
      onChecked: id => String(this.getTimeType(AccumulationStore.getBoardList, 'boardId')) === String(id),
      onChange: (id, bool) => {
        AccumulationStore.setBoardList(this.setStoreCheckData(AccumulationStore.getBoardList, id, 'boardId'));
        this.getColumnData(id, true);
      },
      id: 'boardId',
      text: '看板',
    }, {
      data: AccumulationStore.getColumnData,
      onChecked: id => this.getTimeType(AccumulationStore.getColumnData, 'columnId', 'array').indexOf(String(id)) !== -1,
      onChange: (id, bool) => {
        AccumulationStore.changeColumnData(id, bool);
        this.getData();
      },
      id: 'columnId',
      text: '列',
    }, {
      data: AccumulationStore.getFilterList,
      onChecked: id => this.getTimeType(AccumulationStore.getFilterList, 'filterId', 'array').indexOf(String(id)) !== -1,
      onChange: (id, bool) => {
        AccumulationStore.changeFilterData(id, bool);
        this.getData();
      },
      id: 'filterId',
      text: '快速搜索',
    }];
  }

  // handleOnBrushSelected(params) {
  // }
  render() {
    const { history } = this.props;
    const { linkFromParamUrl } = this.state;
    const urlParams = AppState.currentMenuType;
    return (
      <Page>
        <Header
          title="累积流量图"
          backPath={`/agile/${linkFromParamUrl || 'reporthost'}?type=${urlParams.type}&id=${urlParams.id}&name=${encodeURIComponent(urlParams.name)}&organizationId=${urlParams.organizationId}`}
        >
          <SwithChart
            history={this.props.history}
            current="accumulation"
          />
          <Button funcType="flat" onClick={() => { this.getData(); }}>
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <Content
          title="累积流量图"
          description="显示状态的问题。这有助于您识别潜在的瓶颈, 需要对此进行调查。"
          link="http://v0-10.choerodon.io/zh/docs/user-guide/agile/report/cumulative-flow/"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Spin spinning={this.state.loading}>
            <div className="c7n-accumulation-filter">
              <RangePicker
                value={[moment(AccumulationStore.getStartDate), moment(AccumulationStore.getEndDate)]}
                allowClear={false}
                onChange={(date, dateString) => {
                  AccumulationStore.setStartDate(moment(dateString[0]));
                  AccumulationStore.setEndDate(moment(dateString[1]));
                  this.getData();
                }}
              />
              {
                this.getFilterData().map((item, index) => (
                  <Popover
                    placement="bottom"
                    trigger="click"
                    getPopupContainer={() => document.getElementsByClassName('c7n-accumulation-filter')[0]}
                    content={(
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {
                          item.data.map(items => (
                            <Checkbox
                              checked={item.onChecked(items[item.id])}
                              onChange={(e) => {
                                item.onChange(items[item.id], e.target.checked);
                              }}
                            >
                              {items.name}
                            </Checkbox>
                          ))
                        }
                        {
                          item.id === 'filterId' && !item.data.length ? (
                            <div>无过滤器</div>
                          ) : null
                        }
                      </div>
                    )}
                  >
                    <Button
                      style={{
                        marginLeft: index === 0 ? 20 : 0,
                        color: '#3F51B5',
                      }}
                    >
                      {item.text}
                      <Icon type="baseline-arrow_drop_down" />
                    </Button>
                  </Popover>
                ))
              }
              {
                this.state.optionsVisible ? (
                  <AccumulationFilter
                    visible={this.state.optionsVisible}
                    getTimeType={this.getTimeType.bind(this)}
                    getColumnData={this.getColumnData.bind(this)}
                    getData={this.getData.bind(this)}
                    onCancel={() => {
                      this.getColumnData(this.getTimeType(AccumulationStore.getBoardList, 'boardId'));
                      this.setState({
                        optionsVisible: false,
                      });
                    }}
                  />
                ) : ''
              }
            </div>
            {AccumulationStore.getAccumulationData.length ? (
              <React.Fragment>
                <div className="c7n-accumulation-report" style={{ flexGrow: 1, height: '100%' }}>
                  <ReactEcharts
                    ref={(e) => { this.echarts_react = e; }}
                    option={this.state.options}
                    style={{
                      height: '600px',
                    }}
                    notMerge
                    lazyUpdate
                  />
                </div>
              </React.Fragment>
            ) : <NoDataComponent title="问题" links={[{ name: '问题管理', link: '/agile/issue' }]} img={pic} /> }
          </Spin>
        </Content>
      </Page>
    );
  }
}

export default Form.create()(AccumulationHome);
