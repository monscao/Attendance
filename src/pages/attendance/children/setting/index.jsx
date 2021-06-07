/*
 * @Date: 2021-05-27
 * @Description: 考勤设置
 */
import React, { Component } from 'react';
import moment from 'moment';
import API from '../../../api/api';
import { Row, Col } from 'antd';
import { Picker, DatePicker } from 'antd-mobile';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import './setting.less';

import icon_setting_goto from '@/asset/image/xian/attendance/icon_setting_goto.png';
import icon_map_location from '@/asset/image/xian/attendance/icon_map_location.png';
import icon_range_position from '@/asset/image/xian/attendance/icon_range_position.png';

const ranges = [
    { label: '100米内', value: '100' },
    { label: '500米内', value: '500' },
    { label: '1000米内', value: '1000' },
    { label: '1500米内', value: '1500' },
    { label: '2000米内', value: '2000' },
    { label: '3000米内', value: '3000' }
]

const hours = [
    { label: '00', value: '00' },
    { label: '01', value: '01' },
    { label: '02', value: '02' },
    { label: '03', value: '03' },
    { label: '04', value: '04' },
    { label: '05', value: '05' },
    { label: '06', value: '06' },
    { label: '07', value: '07' },
    { label: '08', value: '08' },
    { label: '09', value: '09' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
    { label: '13', value: '13' },
    { label: '14', value: '14' },
    { label: '15', value: '15' },
    { label: '16', value: '16' },
    { label: '17', value: '17' },
    { label: '18', value: '18' },
    { label: '19', value: '19' },
    { label: '20', value: '20' },
    { label: '21', value: '21' },
    { label: '22', value: '22' },
    { label: '23', value: '23' }
]

const minutes = [
    { label: '00', value: '00' },
    { label: '01', value: '01' },
    { label: '02', value: '02' },
    { label: '03', value: '03' },
    { label: '04', value: '04' },
    { label: '05', value: '05' },
    { label: '06', value: '06' },
    { label: '07', value: '07' },
    { label: '08', value: '08' },
    { label: '09', value: '09' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
    { label: '13', value: '13' },
    { label: '14', value: '14' },
    { label: '15', value: '15' },
    { label: '16', value: '16' },
    { label: '17', value: '17' },
    { label: '18', value: '18' },
    { label: '19', value: '19' },
    { label: '20', value: '20' },
    { label: '21', value: '21' },
    { label: '22', value: '22' },
    { label: '23', value: '23' },
    { label: '24', value: '24' },
    { label: '25', value: '25' },
    { label: '26', value: '26' },
    { label: '27', value: '27' },
    { label: '28', value: '28' },
    { label: '29', value: '29' },
    { label: '30', value: '30' },
    { label: '31', value: '31' },
    { label: '32', value: '32' },
    { label: '33', value: '33' },
    { label: '34', value: '34' },
    { label: '35', value: '35' },
    { label: '36', value: '36' },
    { label: '37', value: '37' },
    { label: '38', value: '38' },
    { label: '39', value: '39' },
    { label: '40', value: '40' },
    { label: '41', value: '41' },
    { label: '42', value: '42' },
    { label: '43', value: '43' },
    { label: '44', value: '44' },
    { label: '45', value: '45' },
    { label: '46', value: '46' },
    { label: '47', value: '47' },
    { label: '48', value: '48' },
    { label: '49', value: '49' },
    { label: '50', value: '50' },
    { label: '51', value: '51' },
    { label: '52', value: '52' },
    { label: '53', value: '53' },
    { label: '54', value: '54' },
    { label: '55', value: '55' },
    { label: '56', value: '56' },
    { label: '57', value: '57' },
    { label: '58', value: '58' },
    { label: '59', value: '59' }
]

class setting extends Component {
    state = {
        configData: {}
    }
    componentWillMount() {
        this.getConfigData();
    }
    MercatorWeblonLat(mercator) {
        let x = mercator.split(',')[0],
            y = mercator.split(',')[1];
        let lng = x / 20037508.34 * 180;
        let lat = y / 20037508.34 * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return {
            lng: lng,
            lat: lat
        };
    }
    getConfigData = async() => {
        let params = {
            accountName: '考勤配置表',
            sortFields: '录入时间',
            dateGroup: '录入时间',
            direction: 'desc'
        }
        Toast.loading('正在加载中...');
        let res = await API.FetchAccountPageList({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let data = res.getMe || [];
            if (data.length) {
                data[0].WebRow.forEach(item => {
                    data[0][item.FieldName] = item.FieldValue;
                })
            }
            this.setState({
                configData: data[0]
            });
            let geoLocation = this.MercatorWeblonLat(data[0]['打卡位置']);
            sessionStorage.setItem('settingInfos', JSON.stringify({ id: data[0]['ID'], address: data[0]['公司地址'], location: data[0]['打卡位置'], geoLocation }));
            let map = new window.AMap.Map('settingMap', {
                mapStyle: 'amap://styles/21dd5fbddf5887f5b5e74366b005f3a7',
                zoom: 15,
                center: [geoLocation.lng, geoLocation.lat]
            });
            let terminal = new AMap.Marker({
                position: new AMap.LngLat(geoLocation.lng, geoLocation.lat),
                icon: icon_map_location,
                offset: new AMap.Pixel(-19, -19)
            });
            map.add(terminal);
        } else {
            Toast.warn('获取配置数据失败!');
        }
    }
    goToMap() {
        this.props.prop.history.push({ pathname: '/map' });
    }
    updateTimes = async(range, startIn, endIn, startOut, endOut) => {
        let rg = parseInt(range.length ? range[0] : this.state.configData['打卡范围']);
        let si = startIn.length ? startIn[0] + ":" + startIn[1] + ':00' : this.state.configData['上班打卡开始时间'];
        let ei = endIn.length ? endIn[0] + ":" + endIn[1] + ':00' : this.state.configData['上班打卡结束时间'];
        let so = startOut.length ? startOut[0] + ":" + startOut[1] + ':00' : this.state.configData['下班打卡开始时间'];
        let eo = endOut.length ? endOut[0] + ":" + endOut[1] + ':00' : this.state.configData['下班打卡结束时间'];
        let params = {
            data: {
                "IDArrs": [this.state.configData['ID']],
                "ColumnValueList": [[rg, si, ei, so, eo]]
            },
            params: {
                tableName: "数据_台账_考勤配置表",
                isTableCheck: false,
                columnNameString: "打卡范围,上班打卡开始时间,上班打卡结束时间,下班打卡开始时间,下班打卡结束时间"
            }
        };
        Toast.loading();
        let res = await API.UpdateDataByTableName(params);
        Toast.hide();
        if (res.statusCode === '0000') {
            this.getConfigData();
        } else {
            Toast.warn('更新打卡配置失败');
        }
    }
    goToSpecial() {
        this.props.prop.history.push({ pathname: '/special' });
    }
    render() {
        let { configData } = this.state;
        return (
            <div className="setting-container">
                <div className="level-first">
                    <Row onClick={ () => this.goToMap() }>
                        <Col span={ 12 }>公司地址</Col>
                        <Col span={ 12 }>
                            <span>
                                <img src={ icon_range_position }/>
                                { configData['公司地址'] || '' }</span>
                            <img src={ icon_setting_goto }/>
                        </Col>
                    </Row>
                    <Picker
                        cols={ 1 }
                        title="选择打卡范围"
                        extra="请选择"
                        data={ ranges }
                        onOk={ val => this.updateTimes(val, '', '', '', '') }>
                        <Row>
                            <Col span={ 12 }>有效范围</Col>
                            <Col span={ 12 }>
                                <span>{ configData['打卡范围'] ? (configData['打卡范围'] + '米内') : '' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                </div>
                <div className="level-first">
                    <Picker
                        cols={ 2 }
                        title="选择上班打卡开始时间"
                        extra="请选择"
                        cascade={false}
                        data={ [hours, minutes] }
                        onOk={ val => this.updateTimes('', val, '', '', '') }>
                        <Row>
                            <Col span={ 12 }>上班打卡时间·开始</Col>
                            <Col span={ 12 }>
                                <span>{ configData['上班打卡开始时间'] ? configData['上班打卡开始时间'].substring(0, 5) : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                    <Picker
                        cols={ 2 }
                        title="选择上班打卡结束时间"
                        extra="请选择"
                        cascade={false}
                        data={ [hours, minutes] }
                        onOk={ val => this.updateTimes('', '', val, '', '') }>
                        <Row>
                            <Col span={ 12 }>上班打卡时间·结束</Col>
                            <Col span={ 12 }>
                                <span>{ configData['上班打卡结束时间'] ? configData['上班打卡结束时间'].substring(0, 5) : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                </div>
                <div className="level-first">
                    <Picker
                        cols={ 2 }
                        title="选择下班打卡开始时间"
                        extra="请选择"
                        cascade={false}
                        data={ [hours, minutes] }
                        onOk={ val => this.updateTimes('', '', '', val, '') }>
                        <Row>
                            <Col span={ 12 }>下班打卡时间·开始</Col>
                            <Col span={ 12 }>
                                <span>{ configData['下班打卡开始时间'] ? configData['下班打卡开始时间'].substring(0, 5) : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                    <Picker
                        cols={ 2 }
                        title="选择下班打卡结束时间"
                        extra="请选择"
                        cascade={false}
                        data={ [hours, minutes] }
                        onOk={ val => this.updateTimes('', '', '', '', val) }>
                        <Row>
                            <Col span={ 12 }>下班打卡时间·结束</Col>
                            <Col span={ 12 }>
                                <span>{ configData['下班打卡结束时间'] ? configData['下班打卡结束时间'].substring(0, 5) : '未设置' }</span>
                                <img src={ icon_setting_goto }/>
                            </Col>
                        </Row>
                    </Picker>
                </div>
                <div className="level-first">
                    <Row onClick={ () => this.goToSpecial() }>
                        <Col span={ 12 }>特殊日期设置</Col>
                        <Col span={ 12 }>
                            <span></span>
                            <img src={ icon_setting_goto }/>
                        </Col>
                    </Row>
                </div>
                <div id="settingMap" className="setting-map"></div>
            </div>
        )
    }
}

export default setting;