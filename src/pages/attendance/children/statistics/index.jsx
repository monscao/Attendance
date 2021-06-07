/*
 * @Date: 2021-05-19
 * @Description: 考勤统计
 */
import React, { Component } from 'react';
import moment from 'moment';
import 'moment/locale/zh-cn';
import API from '../../../api/api';
import { Calendar, Select, Badge, Row, Col } from 'antd';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import './statistics.less';

import icon_arrow_goto from '@/asset/image/xian/attendance/icon_arrow_goto.png';
import icon_arrow_left from '@/asset/image/xian/attendance/icon_arrow_left.png';
import icon_arrow_right from '@/asset/image/xian/attendance/icon_arrow_right.png';
import icon_steps_dot from '@/asset/image/xian/attendance/icon_steps_dot.png';
import icon_steps_line from '@/asset/image/xian/attendance/icon_steps_line.png';
import icon_statistics_position from '@/asset/image/xian/attendance/icon_statistics_position.png';

moment.locale('zh-cn');

class statistics extends Component {
    state = {
        totalNum: 0,
        absentNum: 0,
        absenteeismNum: 0,
        initialDate: moment(),
        locale: {
            lang: {
                month: '月',
                year: '年',
              }
        },
        ruleAddress: '',
        ruleRange: '',
        startTime: '',
        endTime: '',
        startAddress: '',
        endAddress: '',
        startStatus: '',
        endStatus: '',
        monthlyList: [],
        holidaysList: []
    }
    componentWillMount() {
        let infos = JSON.parse(sessionStorage.getItem('userInfo'));
        this.name = infos.fullName;
        this.getHolidaysData();
        this.getMonthlyStatisticsData();
        let dateInfos = JSON.parse(localStorage.getItem('dateInfos'));
        dateInfos && this.setState({ initialDate: moment(dateInfos.date) });
        this.getDailyStatisticsData(moment(this.state.initialDate).format('YYYY-MM-DD'));
    }
    goToManagement() {
        sessionStorage.setItem('attendanceInfos', JSON.stringify({ father: 'statistics' }));
        localStorage.setItem('dateInfos', JSON.stringify({ date: this.date }));
        this.props.prop.history.push({ pathname: '/management', params: { tab: 'statistics' } });
    }
    changeDate(date) {
        this.date = moment(date).format('YYYY-MM-DD');
        this.getDailyStatisticsData(moment(date).format('YYYY-MM-DD'));
        let newYear = moment(date).format('YYYY'), newMonth = moment(date).format('MM');
        if ((newYear != moment(this.state.initialDate).format('YYYY')) || (newMonth != moment(this.state.initialDate).format('MM'))) {
            this.getMonthlyStatisticsData(date);
        }
        this.setState({ initialDate: moment(date) });
    }
    getDailyStatisticsData = async (date) => {
        let params = {
            accountName: '考勤记录表',
            sortFields: '录入时间',
            dateGroup: '打卡日期',
            direction: 'desc',
            queryWhere: `AND 用户名称='${ this.name }' AND 打卡日期 between '${ date + ' 00:00:00' }' AND '${ date + ' 23:59:59' }'`
        }
        Toast.loading('正在加载中...');
        let res = await API.FetchAccountPageList({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let data = JSON.parse(res.jsonData);
            if (data.length) {
                let startStatus = data[0]['上班时间'] && this.configData ? this.getAttendanceStatus(moment(new Date(data[0]['上班时间'])).format('HH:mm:ss'), this.configData) : '缺卡';
                let endStatus = data[0]['下班时间'] && this.configData ? this.getAttendanceStatus(moment(new Date(data[0]['下班时间'])).format('HH:mm:ss'), this.configData) : '缺卡';
                this.setState({
                    startTime: data[0]['上班时间'] || '',
                    endTime: data[0]['下班时间'] || '',
                    startAddress: data[0]['上班打卡位置'] || '',
                    endAddress: data[0]['下班打卡位置'] || '',
                    startStatus,
                    endStatus
                });
            } else {
                this.setState({ startTime: '', endTime: '', startAddress: '', endAddress: '', startStatus: '缺卡', endStatus: '缺卡' });
            }
        } else {
            Toast.warn('请求数据失败!')
        }
    }
    getHolidaysData = async() => {
        let queryObj = {
            accountName: '假期缓存表',
            sortFields: '日期',
            direction: 'desc'
        }
        Toast.loading('正在加载中...');
        let cacheRes = await API.FetchAccountPageList({ queryObj });
        Toast.hide();
        if (cacheRes.say.statusCode === '0000') {
            let cacheData = JSON.parse(cacheRes.jsonData);
            let holidaysList = [];
            if (cacheData.length) {
                cacheData.forEach(item => {
                    holidaysList.push({
                        date: moment(item['日期']).format("YYYY-MM-DD"),
                        type: item['假期类型']
                    });
                })
            }
            this.setState({ holidaysList });
        } else {
            Toast.warn('请求数据失败!')
        }
    }
    getMonthlyStatisticsData = async (date) => {
        let arrgus = {
            accountName: '考勤配置表',
            sortFields: '录入时间',
            dateGroup: '录入时间',
            direction: 'desc'
        }
        Toast.loading('正在加载中...');
        let configRes = await API.FetchAccountPageList({ queryObj: arrgus });
        Toast.hide();
        if (configRes.say.statusCode === '0000') {
            let configData = configRes.getMe || [];
            if (configData.length) {
                configData[0].WebRow.forEach(item => {
                    configData[0][item.FieldName] = item.FieldValue;
                })
            }
            this.configData = configData[0] || {};
            this.setState({
                ruleAddress: configData[0]['公司地址'],
                ruleRange: configData[0]['上班时间'].substring(0, configData[0]['上班时间'].length - 3) + '-' + configData[0]['下班时间'].substring(0, configData[0]['下班时间'].length - 3)
            });
        } else {
            Toast.warn('获取配置数据失败!')
        }

        let currentDate = date || this.state.initialDate;
        let params = {
            Name: this.name,
            dateFrom: moment(currentDate).format('YYYY-MM-') + '01',
            dateTo: moment(currentDate).format('YYYY-MM-') + moment(moment(currentDate).format('YYYY-MM-DD'), 'YYYY-MM').daysInMonth(),
            pageIndex: 1,
            pageSize: 9999
        }
        Toast.loading();
        let res = await API.GetAttendanceStatistics({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let statisticsData = res.getMe[0];
            if (statisticsData.checkingCards.length) {
                this.setState({
                    totalNum: statisticsData.checkingCards[0].Record,
                    absentNum: statisticsData.checkingCards[0].Early,
                    absenteeismNum: statisticsData.checkingCards[0].Lack
                });
            } else {
                this.setState({ totalNum: 0, absentNum: 0, absenteeismNum: 0 });
            }
        } else {
            Toast.warn('请求数据失败!')
        }

        let query = {
            accountName: '考勤记录表',
            sortFields: '录入时间',
            dateGroup: '打卡日期',
            direction: 'desc',
            queryWhere: `AND 用户名称='${ this.name }' AND 打卡日期 between '${ moment(currentDate).format('YYYY-MM-') + '01 00:00:00' }' AND '${ moment(currentDate).format('YYYY-MM-') + moment(moment(currentDate).format('YYYY-MM-DD'), 'YYYY-MM').daysInMonth() + ' 23:59:59' }'`
        }
        Toast.loading('正在加载中...');
        let result = await API.FetchAccountPageList({ queryObj: query });
        Toast.hide();
        if (result.say.statusCode === '0000') {
            let badgeData = JSON.parse(result.jsonData);
            let list = [];
            for (let i = 1; i <= moment(moment(currentDate).format('YYYY-MM')).daysInMonth(); i ++) {
                let listDate = moment(currentDate).format('YYYY-MM') + (i < 10 ? '-0' : '-') + i;
                let dayData = badgeData.filter(item => {
                    return moment(item['打卡日期']).format('YYYY-MM-DD') == listDate;
                })
                let type = 'success';
                if (dayData.length) {
                    let itemData = dayData[0];
                    if (itemData['上班时间'] && itemData['下班时间']) {
                        (this.getAttendanceStatus(moment(itemData['上班时间']).format('HH:mm:ss'), this.configData) == '正常上班' && this.getAttendanceStatus(moment(itemData['下班时间']).format('HH:mm:ss'), this.configData) == '正常下班') && (type  = 'success');
                        (this.getAttendanceStatus(moment(itemData['上班时间']).format('HH:mm:ss'), this.configData) == '迟到' || this.getAttendanceStatus(moment(itemData['下班时间']).format('HH:mm:ss'), this.configData) == '早退') && (type  = 'warning');
                    } else if (itemData['上班时间'] || itemData['下班时间']) {
                        type = 'default';
                    } else {
                        type = 'error';
                    }
                } else {
                    type = 'error';
                }
                let content =
                    this.isWeekDay(listDate) &&
                    moment(listDate).format('YYYY-MM-DD') < moment().format('YYYY-MM-DD') &&
                    moment(this.state.initialDate).format('YYYY-MM-00') < moment(listDate).format('YYYY-MM-DD') &&
                    (moment(listDate).format('YYYY-MM-DD') <= moment(this.state.initialDate).format('YYYY-MM-') + moment(moment(this.state.initialDate).format('YYYY-MM-DD'), 'YYYY-MM').daysInMonth()) ? <Badge status={ type }/> : '';
                list.push({
                    date: listDate,
                    content
                })
            }
            this.setState({ monthlyList: list});
        } else {
            Toast.warn('请求数据失败!')
        }
    }
    getAttendanceStatus(time, data) {
        let status = '正常上班';
        if (data['上班打卡开始时间'].substring(0, 8) <= time && time <= data['上班时间']) {
            status = '正常上班';
        } else if (data['下班时间'] <= time && time <= data['下班打卡结束时间'].substring(0, 8)) {
            status = '正常下班';
        } else if (data['上班打卡开始时间'].substring(0, 8) > time || time >  data['下班打卡结束时间'].substring(0, 8)) {
            status = '超出';
        } else if (data['上班时间'] < time && time < data['上班打卡结束时间'].substring(0, 8)) {
            status = '迟到';
        } else if (data['下班打卡开始时间'].substring(0, 8) < time && time < data['下班时间']) {
            status = '早退';
        }
        return status;
    }
    isWeekDay(date) {
        let result = false;
        if (moment(date).format('dddd') != '星期六' && moment(date).format('dddd') != '星期日') {
            result = true;
        }
        this.state.holidaysList.forEach(item => {
            if (item.date == date) {
                result = item.type == 1 ? false : true;
            }
        })
        return result;
    }
    getCellAppend(date) {
        let formatDate = moment(date).format('YYYY-MM-DD');
        let contentData = this.state.monthlyList.filter(item => {
            return item.date == formatDate;
        })
        return contentData[0] ? contentData[0].content : '';
    }
    render() {
        let { totalNum, absentNum, absenteeismNum, initialDate, locale, ruleAddress, ruleRange, startTime, endTime, startAddress, endAddress, startStatus, endStatus } = this.state;
        return (
            <div className="statistics-container">
                <div className="statistics-summary" onClick={ () => this.goToManagement() }>
                    <h5>
                        { moment(initialDate).format('MM').substring(0, 1) == '0' ? initialDate.format('MM').substring(1, 2) : initialDate.format('MM') }月汇总
                        <img src={ icon_arrow_goto }/>
                    </h5>
                    <div className="summary-content">
                        <div>
                            <span>{ totalNum }</span>
                            <span>出勤(天)</span>
                        </div>
                        <div>
                            <span>{ absentNum }</span>
                            <span>缺勤(天)</span>
                        </div>
                        <div>
                            <span>{ absenteeismNum }</span>
                            <span>旷工(天)</span>
                        </div>
                    </div>
                </div>
                <div className="statistics-record">
                    <h5>考勤记录</h5>
                    <Calendar
                        className="calendar-container"
                        fullscreen={ false }
                        locale={ locale }
                        defaultValue={ initialDate }
                        dateCellRender={ (date) => this.getCellAppend(date) }
                        onChange={ (date) => this.changeDate(date) }
                        headerRender={ ({ value, type, onChange }) => {
                            const start = 0;
                            const end = 12;
                            const monthOptions = [];

                            const current = value.clone();
                            const localeData = value.localeData();
                            const months = [];
                            for (let i = 0; i < 12; i ++) {
                                current.month(i);
                                months.push(localeData.monthsShort(current));
                            }
                            for (let index = start; index < end; index ++) {
                                monthOptions.push(
                                    <Select.Option className="month-item" key={`${ index }`}>
                                        { months[index] }
                                    </Select.Option>,
                                );
                            }
                            const month = value.month();
                            const year = value.year();
                            const options = [];
                            for (let i = year - 10; i < year + 10; i += 1) {
                                options.push(<Select.Option key={ i } value={ i } className="year-item">{ i }</Select.Option>);}
                            const currentYear = moment(value).format('YYYY')
                            const currentMonth = moment(value).format('MM');
                            const currentDay = moment(value).format('DD');
                            const lastYear = moment(value).format('YYYY') - 1;
                            const nextYear = parseInt(moment(value).format('YYYY')) + 1;
                            function turnLeft() {
                                if(currentMonth == '01') {
                                    onChange(moment(new Date(lastYear + '-12-' + currentDay)));
                                } else {
                                    onChange(moment(new Date(currentYear + '-' + (currentMonth - 1) + '-' + currentDay)));
                                }
                            }
                            function turnRight() {
                                if(currentMonth == '12') {
                                    onChange(moment(new Date(nextYear + '-01-' + currentDay)));
                                } else {
                                    onChange(moment(new Date(currentYear + '-' + (parseInt(currentMonth) + 1) + '-' + currentDay)));
                                }
                            }
                            return (
                                <div style={{ padding: 8 }} className="calendar-header">
                                    <img src={ icon_arrow_left } onClick={ () => turnLeft() }/>
                                    <div className="selectors-container">
                                        <Select
                                            size="small"
                                            value={ String(year) + '年' }
                                            dropdownMatchSelectWidth={ false }
                                            className="my-year-select"
                                            onChange={ newYear => { const now = value.clone().year(newYear); onChange(now); }}>
                                            { options }
                                        </Select>
                                        <Select
                                            size="small"
                                            dropdownMatchSelectWidth={ false }
                                            value={ String(month) }
                                            onChange={ selectedMonth => {
                                                const newValue = value.clone();
                                                newValue.month(parseInt(selectedMonth, 10));
                                                onChange(newValue);
                                            }}>
                                            {monthOptions}
                                        </Select>
                                    </div>
                                    <img src={ icon_arrow_right } onClick={ () => turnRight() }/>
                                </div>
                              );
                        }}
                    />
                    <div className="badge-explain">
                        <Row>
                            <Col span={ 5 }>
                                <Badge status="success"/>正常
                            </Col>
                            <Col span={ 8 }>
                                <Badge status="warning"/>迟到/早退
                            </Col>
                            <Col span={ 5 }>
                                <Badge status="default"/>缺勤
                            </Col>
                            <Col span={ 6 }>
                                <Badge status="error"/>旷工
                            </Col>
                        </Row>
                    </div>
                    <div className="current-record">
                        <div className="statistics-rule">
                            规则: 固定上下班 
                            <span>{ ruleAddress }</span>
                            { ruleRange }
                        </div>
                        <div className="record-infos" style={{ display: (moment(initialDate).format('YYYY-MM-DD') < moment().format('YYYY-MM-DD') && this.isWeekDay(moment(initialDate).format('YYYY-MM-DD'))) ? 'flex' : 'none' }}>
                            <div className="steps-container">
                                {
                                    // (startTime || endTime) &&
                                    <img src={ icon_steps_dot }/>
                                }
                                {   
                                    // endTime &&
                                    <img src={ icon_steps_line }/>
                                }
                            </div>
                            <div className="record-container">
                                <div className="clock-box">
                                    <span>
                                        { '上班打卡 ' + (startTime ? moment(new Date(startTime)).format('HH:mm:ss') : '无') }
                                        <span className={ (startStatus === '正常上班' ? 'blue' : (startStatus === '迟到' ? 'yellow' : 'red')) + ' status-badge' }>
                                            { startStatus === '正常上班' ? '正常' : (startStatus === '迟到' ? '迟到' : '缺卡') }
                                        </span>
                                    </span>
                                    {
                                       startStatus !== '缺卡' && startAddress &&
                                        <span>
                                            <img src={ icon_statistics_position }/>
                                            <span className="address-container">{ startAddress }</span>
                                        </span>
                                    }
                                </div>
                                <div className="clock-box">
                                    <span>
                                        { '下班打卡 ' + (endTime ? moment(new Date(endTime)).format('HH:mm:ss') : '无') }
                                        <span className={ (endStatus === '正常下班' ? 'blue' : (endStatus === '早退' ? 'yellow' : 'red')) + ' status-badge' }>
                                            { endStatus === '正常下班' ? '正常' : (endStatus === '早退' ? '早退' : '缺卡') }
                                        </span>
                                    </span>
                                    {
                                        endStatus !== '缺卡' && endAddress &&
                                        <span>
                                            <img src={ icon_statistics_position }/>
                                            <span className="address-container">{ endAddress }</span>
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default statistics;