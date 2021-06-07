/*
 * @Date: 2021-05-28
 * @Description: 特殊日期
 */
import React, { Component } from 'react';
import moment from 'moment';
import API from '../../../../../api/api';
import { Row, Col } from 'antd';
import { Picker, Modal, DatePicker } from 'antd-mobile';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import './special.less';

import icon_setting_goto from '@/asset/image/xian/attendance/icon_setting_goto.png';
import icon_setting_delete from '@/asset/image/xian/attendance/icon_setting_delete.png';
import icon_special_add from '@/asset/image/xian/attendance/icon_special_add.png';

const alert = Modal.alert;
const prompt = Modal.prompt;

class special extends Component {
    state = {
        list: []
    }
    componentWillMount() {
        sessionStorage.setItem('attendanceInfos', JSON.stringify({ father: 'setting' }));
        this.getSpecialList();
    }
    getSpecialList = async() => {
        let params = {
            accountName: '假期缓存表',
            sortFields: '日期',
            direction: 'desc',
            queryWhere: `AND 特殊日期 = 1`
        }
        Toast.loading('正在加载中...');
        let res = await API.FetchAccountPageList({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let data = JSON.parse(res.jsonData);
            if (data.length) {
                this.setState({ list: data });
            } else {
                this.setState({ });
            }
        } else {
            Toast.warn('请求数据失败!')
        }
    }
    addItem = async(name) => {
        let params = {
            data: [[name, 1, 1]],
            params: {
                tableName: '集团_假期缓存表',
                isTableCheck: false,
                columnNameString: "假期名称,假期类型,特殊日期"
            }
        };
        Toast.loading();
        let res = await API.ImportDataByTableName(params);
        Toast.hide();
        if (res.statusCode === '0000') {
            this.getSpecialList();
        } else {
            Toast.warn('更新打卡配置失败');
        }
    }
    deleteItem = async(id) => {
        let params = {
            id,
            tableName: '集团_假期缓存表'
        }
        Toast.loading();
        let res = await API.LogicalDeleteTableData({ queryObj: params });
        Toast.hide();
        if (res.statusCode === '0000') {
            this.getSpecialList();
        } else {
            Toast.warn('删除数据失败');
        }
    }
    updateItem = async(id, date, type) => {
        let params = {
            data: {
                "IDArrs": [id],
                "ColumnValueList": [[moment(date).format('YYYY-MM-DD'),type]]
            },
            params: {
                tableName: "集团_假期缓存表",
                isTableCheck: false,
                columnNameString: "日期,假期类型"
            }
        };
        Toast.loading();
        let res = await API.UpdateDataByTableName(params);
        Toast.hide();
        if (res.statusCode === '0000') {
            this.getSpecialList();
        } else {
            Toast.warn('更新打卡配置失败');
        }
    }
    renderList(list) {
        return list.map(item => {
            return (
                <div className="card-item">
                    <Row>
                        <Col span={ 6 }>{ item['假期名称'] }</Col>
                        <Col span={ 18 } onClick={() =>
                            alert('删除', '删除这条特殊日期吗', [
                            { text: '取消' },
                            { text: '确定', onPress: () => this.deleteItem(item.ID) },
                            ])
                        }>
                            <img src={ icon_setting_delete }/>
                            <span>删除</span>
                        </Col>
                    </Row>
                    <Picker
                        cols={ 1 }
                        title="选择考勤对象"
                        extra="请选择"
                        data={ [{ label: '全部', value: '全部' }] }
                        onOk={ val => {} }>
                        <Row>
                            <Col span={ 6 }>考勤对象</Col>
                            <Col span={ 18 }>
                                <span>全部</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                    <DatePicker
                        mode="date"
                        title="选择日期"
                        extra="Optional"
                        value={ new Date(item['日期']) }
                        onChange={ date => this.updateItem(item.ID, date, item['假期类型']) }>
                        <Row>
                            <Col span={ 6 }>特殊日期</Col>
                            <Col span={ 18 }>
                                <span>{ item['日期'] ? moment(item['日期']).format('YYYY-MM-DD') : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </DatePicker>
                    <Picker
                        cols={ 1 }
                        title="选择假期类型"
                        extra="请选择"
                        data={ [{ label: '上班', value: '2' }, { label: '放假', value: '1' }] }
                        onOk={ type => this.updateItem(item.ID, item['日期'] ? moment(item['日期']).format('YYYY-MM-DD') : '', type[0] ) }>
                        <Row style={{ border: 'none' }}>
                            <Col span={ 6 }>假期类型</Col>
                            <Col span={ 18 }>
                                <span>{ item['假期类型'] ? (item['假期类型'] == '1' ? '放假' : '上班') : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                </div>
            )
        })
    }
    render() {
        let { list } = this.state;
        return (
            <div className="special-container">
                <div className="card-container">
                    {
                        list.length && this.renderList(list)
                    }
                </div>
                <div className="add-special">
                    <button onClick={() => prompt(
                        '新增特殊日期', '',
                        [
                            { text: '取消' },
                            { text: '提交', onPress: name => this.addItem(name) },
                        ],
                        'default', null, ['请输入特殊日期名称'])}>
                        <img src={ icon_special_add }/>添加特殊日期
                    </button>
                </div>
            </div>
        )
    }
}

export default special;