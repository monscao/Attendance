/*
 * @Date: 2021-05-19
 * @Description: 考勤管理
 */
import React, { Component } from 'react';
import moment from 'moment';
import 'moment/locale/zh-cn';
import API from '../../../../../api/api';
import { Select } from 'antd';
import { Row, Col } from 'antd';
import { Tabs, Accordion, List } from 'antd-mobile';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import './management.less';

import icon_attendance_calendar from '@/asset/image/xian/attendance/icon_attendance_calendar.png';
import icon_turn_left from '@/asset/image/xian/attendance/icon_turn_left.png';
import icon_turn_right from '@/asset/image/xian/attendance/icon_turn_right.png';

moment.locale('zh-cn');

const { Option } = Select;
class management extends Component {
    state = {
        isManager: false,
        tab: '我的考勤',
        timeRange: 'week',
        startTime: moment().day(0),
        endTime: moment().day(6),
        image: '',
        name: '',
        group: '',
        myList: [],
        groupList: []
    }
    componentWillMount() {
        let infos = JSON.parse(sessionStorage.getItem('userInfo'));
        let image = infos.UserImge,
            name = infos.fullName,
            group = infos.depart.name
        this.name = infos.fullName;
        this.setState({ image, name, group });
        this.getStatisticsData(moment().day(0), moment().day(6), this.state.tab);
        let userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        userInfo && userInfo.roles.forEach(item => {
            if (item.name === '考勤管理员') {
                this.setState({ isManager: true });
            }
        })
    }
    switchTabs(tab) {
        this.state.tab = tab.title;
        this.getStatisticsData(moment().day(0), moment().day(6), this.state.tab);
        this.setState({ timeRange: 'week', startTime: moment().day(0), endTime: moment().day(6) });
    }
    changeRangeType(type) {
        let startTime = type === 'week' ? moment().day(0) : moment(moment().format('YYYY-MM-01'));
        let endTime = type === 'week' ? moment().day(6) : moment().endOf('month');
        this.setState({ timeRange: type, startTime, endTime });
        this.getStatisticsData(startTime, endTime, this.state.tab);
    }
    turnDateLeft() {
        let startTime = null, endTime = null;
        if (this.state.timeRange === 'week') {
            startTime = moment(this.state.startTime).subtract(1, 'week');
            endTime = moment(this.state.endTime).subtract(1, 'week');
        } else {
            startTime = moment(this.state.startTime).subtract(1, 'month');
            endTime = moment(moment(this.state.endTime).subtract(1, 'month').format('YYYY-MM-') + moment(this.state.endTime).subtract(1, 'month').endOf('month').format('DD'));
        }
        this.setState({ startTime, endTime });
        this.getStatisticsData(startTime, endTime, this.state.tab);
    }
    turnDateRight() {
        let startTime = null, endTime = null;
        if (this.state.timeRange === 'week') {
            startTime = moment(this.state.startTime).add(1, 'week');
            endTime = moment(this.state.endTime).add(1, 'week');
        } else {
            startTime = moment(this.state.startTime).add(1, 'month');
            endTime = moment(moment(this.state.endTime).add(1, 'month').format('YYYY-MM-') + moment(this.state.endTime).add(1, 'month').endOf('month').format('DD'));
        }
        this.setState({ startTime, endTime });
        this.getStatisticsData(startTime, endTime, this.state.tab);
    }
    getStatisticsData = async (startTime, endTime, tab) => {
        let start = moment(startTime).format('YYYY-MM-DD'), end = endTime > moment() ? moment().subtract(1, 'days').format('YYYY-MM-DD') : moment(endTime).format('YYYY-MM-DD');
        let params = {
            Name: tab === '我的考勤' ? this.name : '',
            dateFrom: start,
            dateTo: end
        }
        Toast.loading("正在加载中...");
        let res = await API.getAttendanceManagementData({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let data = res.getMe || [];
            data.forEach(item => {
                data[item.TimeCardTypes] = item.cardChecks;
            })
            if (tab === '我的考勤') {
                this.setState({ myList: data })
            } else {
                this.setState({ groupList: data })
            }
        } else {
            Toast.warn('获取统计数据失败!')
        }
    }
    getList(data, type) {
        return data.map(item => {
            return type === 'my' ? 
            <List.Item>{ moment(item.DateDay).format('YYYY-MM-DD') + ` (${ moment(item.DateDay).format('dddd') })` }</List.Item>:
            <List.Item>
                <Row>
                    <Col span={ 12 }>{ item.Name || '--' }</Col>
                    <Col span={ 12 }>{ moment(item.DateDay).format('YYYY-MM-DD') }</Col>
                </Row>
            </List.Item>
        })
    }
    getAccordionHeader(title, list) {
        let unit = '次';
        if (title === '出勤天数' || title === '休息天数') {
            unit = '天';
        }
        return (<Row><Col span={ 12 }>{ title }</Col><Col span={ 12 }>{ (list ? list.length : 0) + unit }</Col></Row>);
    }
    goBack() {
        window.history.back();
    }
    render() {
        let { isManager, timeRange, startTime, endTime, image, name, group, myList, groupList } = this.state;
        const tabs = [
            { title: '团队考勤' },
            { title: '我的考勤'}
        ]
        return (
            <div className="management-container">
                {   isManager &&
                    <Tabs tabs={ tabs }
                        initialPage={ 1 }
                        onChange={ (tab) => { this.switchTabs(tab) } }>
                        <div>
                            <div className="action-container">
                                <div className="buttons-container">
                                    <button className={ timeRange === 'week' ? 'button-active' : '' } onClick={ () => this.changeRangeType('week') }>周</button>
                                    <button className={ timeRange === 'month' ? 'button-active' : '' } onClick={ () => this.changeRangeType('month') }>月</button>
                                </div>
                                <div className="date-container">
                                    <img src={ icon_turn_left } onClick={ ()=> this.turnDateLeft() }/>
                                    <span>{ startTime.format('MM.DD') + ' - ' + endTime.format('MM.DD') }</span>
                                    <img src={ icon_turn_right } onClick={ ()=> this.turnDateRight() }/>
                                </div>
                            </div>
                            <div className="content-container">
                                <div className="basic-information" style={{ height: '1.17rem', padding: '0 0.64rem' }}>
                                    <span className="group-title">考勤组:</span>
                                    <Select size="small" defaultValue={ '全部' } onChange={ () => {} }>
                                        <Option value="全部">全部</Option>
                                    </Select>
                                    <div className="back-container">
                                        <img src={ icon_attendance_calendar } onClick={ () => this.goBack() }/>
                                        <span onClick={ () => this.goBack() }>打卡日历</span>
                                    </div>
                                </div>
                                <Accordion onChange={ () => {}}>
                                    <Accordion.Panel header={ this.getAccordionHeader('出勤天数', groupList['出勤']) }>
                                        <List>{ groupList['出勤'] && this.getList(groupList['出勤'], 'group') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('休息天数', groupList['休息']) }>
                                        <List>{ groupList['休息'] && this.getList(groupList['休息'], 'group') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('迟到', groupList['迟到']) }>
                                        <List>{ groupList['迟到'] && this.getList(groupList['迟到'], 'group') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('早退', groupList['早退']) }>
                                        <List>{ groupList['早退'] && this.getList(groupList['早退'], 'group') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('缺卡', groupList['缺卡']) }>
                                        <List>{ groupList['缺卡'] && this.getList(groupList['缺卡'], 'group') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('旷工', groupList['旷工']) }>
                                        <List>{ groupList['旷工'] && this.getList(groupList['旷工'], 'group') }</List>
                                    </Accordion.Panel>
                                </Accordion>
                            </div>
                        </div>
                        <div>
                            <div className="action-container">
                                <div className="buttons-container">
                                    <button className={ timeRange === 'week' ? 'button-active' : '' } onClick={ () => this.changeRangeType('week') }>周</button>
                                    <button className={ timeRange === 'month' ? 'button-active' : '' } onClick={ () => this.changeRangeType('month') }>月</button>
                                </div>
                                <div className="date-container">
                                    <img src={ icon_turn_left } onClick={ ()=> this.turnDateLeft() }/>
                                    <span>{ startTime.format('MM.DD') + ' - ' + endTime.format('MM.DD') }</span>
                                    <img src={ icon_turn_right } onClick={ ()=> this.turnDateRight() }/>
                                </div>
                            </div>
                            <div className="content-container">
                                <div className="basic-information">
                                    <img src={ image } alt="avatar" />
                                    <div className="name-container">
                                        <h5>{ name }</h5>
                                        <span>考勤组: { group }</span>
                                    </div>
                                    <div className="back-container">
                                        <img src={ icon_attendance_calendar } onClick={ () => this.goBack() }/>
                                        <span onClick={ () => this.goBack() }>打卡日历</span>
                                    </div>
                                </div>
                                <Accordion onChange={ () => {}}>
                                    <Accordion.Panel header={ this.getAccordionHeader('出勤天数', myList['出勤']) }>
                                        <List>{ myList['出勤'] && this.getList(myList['出勤'], 'my') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('休息天数', myList['休息']) }>
                                        <List>{ myList['休息'] && this.getList(myList['休息'], 'my') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('迟到', myList['迟到']) }>
                                        <List>{ myList['迟到'] && this.getList(myList['迟到'], 'my') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('早退', myList['早退']) }>
                                        <List>{ myList['早退'] && this.getList(myList['早退'], 'my') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('缺卡', myList['缺卡']) }>
                                        <List>{ myList['缺卡'] && this.getList(myList['缺卡'], 'my') }</List>
                                    </Accordion.Panel>
                                    <Accordion.Panel header={ this.getAccordionHeader('旷工', myList['旷工']) }>
                                        <List>{ myList['旷工'] && this.getList(myList['旷工'], 'my') }</List>
                                    </Accordion.Panel>
                                </Accordion>
                            </div>
                        </div>
                    </Tabs>
                }
                {
                    !isManager &&
                    <div>
                        <div className="action-container">
                            <div className="buttons-container">
                                <button className={ timeRange === 'week' ? 'button-active' : '' } onClick={ () => this.changeRangeType('week') }>周</button>
                                <button className={ timeRange === 'month' ? 'button-active' : '' } onClick={ () => this.changeRangeType('month') }>月</button>
                            </div>
                            <div className="date-container">
                                <img src={ icon_turn_left } onClick={ ()=> this.turnDateLeft() }/>
                                <span>{ startTime.format('MM.DD') + ' - ' + endTime.format('MM.DD') }</span>
                                <img src={ icon_turn_right } onClick={ ()=> this.turnDateRight() }/>
                            </div>
                        </div>
                        <div className="content-container">
                            <div className="basic-information">
                                <img src={ image } alt="avatar" />
                                <div className="name-container">
                                    <h5>{ name }</h5>
                                    <span>考勤组: { group }</span>
                                </div>
                                <div className="back-container">
                                    <img src={ icon_attendance_calendar } onClick={ () => this.goBack() }/>
                                    <span onClick={ () => this.goBack() }>打卡日历</span>
                                </div>
                            </div>
                            <Accordion onChange={ () => {}}>
                                 <Accordion.Panel header={ this.getAccordionHeader('出勤天数', myList['出勤']) }>
                                    <List>{ myList['出勤'] && this.getList(myList['出勤'], 'my') }</List>
                                </Accordion.Panel>
                                <Accordion.Panel header={ this.getAccordionHeader('休息天数', myList['休息']) }>
                                    <List>{ myList['休息'] && this.getList(myList['休息'], 'my') }</List>
                                </Accordion.Panel>
                                <Accordion.Panel header={ this.getAccordionHeader('迟到', myList['迟到']) }>
                                    <List>{ myList['迟到'] && this.getList(myList['迟到'], 'my') }</List>
                                </Accordion.Panel>
                                <Accordion.Panel header={ this.getAccordionHeader('早退', myList['早退']) }>
                                    <List>{ myList['早退'] && this.getList(myList['早退'], 'my') }</List>
                                </Accordion.Panel>
                                <Accordion.Panel header={ this.getAccordionHeader('缺卡', myList['缺卡']) }>
                                    <List>{ myList['缺卡'] && this.getList(myList['缺卡'], 'my') }</List>
                                </Accordion.Panel>
                                <Accordion.Panel header={ this.getAccordionHeader('旷工', myList['旷工']) }>
                                    <List>{ myList['旷工'] && this.getList(myList['旷工'], 'my') }</List>
                                </Accordion.Panel>
                            </Accordion>
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export default management;