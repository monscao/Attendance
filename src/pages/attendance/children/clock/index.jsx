/*
 * @Date: 2021-05-11
 * @Description: 打卡
 */
import React, { Component } from 'react';
import API from '../../../api/api';
import moment from 'moment';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import Main from './children/main';
import './clock.less';

import icon_attendance_normal from '@/asset/image/xian/attendance/icon_attendance_normal.png';
import icon_attendance_unusual from '@/asset/image/xian/attendance/icon_attendance_unusual.png';
import icon_record_checkin from '@/asset/image/xian/attendance/icon_record_checkin.png';
import icon_record_checkout from '@/asset/image/xian/attendance/icon_record_checkout.png';
import icon_record_position from '@/asset/image/xian/attendance/icon_record_position.png';
import icon_avator_default from '@/asset/image/xian/attendance/icon_avator_default.png';

class clock extends Component {
    state = {
        image: '',
        name: '',
        group: '',
        timeStatus: '',
        terminal: null,
        distance: 10000,
        range: 0,
        ruledTimeIn: '',
        ruledTimeOut: '',
        startTime: '',
        endTime: '',
        startAddress: '',
        endAddress: '',
        day: '',
        showCheckIn: false,
        showCheckOut: false,
        configData: null,
        currentPosition: '',
        result: '',
        time: '',
        showResult: false,
        isLoading: true
    }
    componentWillMount() {
        this.getRecordData();
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }
    getRecordData = async() => {
        let infos = JSON.parse(sessionStorage.getItem('userInfo'));
        let image = infos.UserImge,
            name = infos.fullName,
            group = infos.depart.name,
            day = '';
        if (image) {
            image = window.location.origin + '/CityInterface/rest/services/FileDownload.svc/download/' + image;
            if (infos.LocalSite) {
                image += `?_site=${ infos.LocalSite }`;
            }
        } else {
            image = icon_avator_default;
        }
        switch (new Date().getDay()) {
            case 0:
                day = "日";
                break;
            case 1:
                day = "一";
                break;
            case 2:
                day = "二";
                break;
            case 3:
                day = "三";
                break;
            case 4:
                day = "四";
                break;
            case 5:
                day = "五";
                break;
            case 6:
                day = "六";
                break;
            default:
                break;
        }
        let me = this;
        let params = {
            accountName: '考勤记录表',
            sortFields: '录入时间',
            dateGroup: '打卡日期',
            direction: 'desc',
            queryWhere: `AND 用户名称='${ name }' AND 打卡日期 between '${ moment(new Date()).format('YYYY-MM-DD 00:00:00') }' AND '${ moment(new Date()).format('YYYY-MM-DD 23:59:59') }'`
        }
        Toast.loading('正在加载中...');
        let res = await API.FetchAccountPageList({ queryObj: params });
        Toast.hide();
        if (res.say.statusCode === '0000') {
            let data = JSON.parse(res.jsonData);
            if (data.length) {
                me.getConfigData(image, name, group, day, data[0]['上班时间'], data[0]['下班时间'], data[0]['上班打卡位置'], data[0]['下班打卡位置'])
            } else {
                me.getConfigData(image, name, group, day, '', '', '', '');
            }
        } else {
            Toast.warn('请求数据失败!')
        }
    }
    getConfigData = async(image, name, group, day, startTime, endTime, startAddress, endAddress) => {
        let me = this;
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
            let current = moment().format('HH:mm:ss');
            this.setState({
                image, name, group, day, startTime, endTime, startAddress, endAddress,
                timeStatus: me.getAttendanceStatus(current, data[0]),
                terminal: data[0]['公司地址'],
                range: data[0]['打卡范围'],
                ruledTimeIn: data[0]['上班时间'],
                ruledTimeOut: data[0]['下班时间'],
                showCheckIn: current > data[0]['上班打卡结束时间'].substring(0, 8),
                showCheckOut: current > data[0]['下班打卡结束时间'].substring(0, 8),
                configData: data[0]
            });
            this.position = data[0]['打卡位置'];
            this.getDistance();
            this.timer && clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.getDistance(data[0]['打卡位置']);
            }, 5000);
        } else {
            Toast.warn('获取配置数据失败!')
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
    getDistance() {
        let me = this;
        let map = new window.AMap.Map('location', {
            mapStyle: 'amap://styles/275ced74b3a5e9bae7a61a05cbe80f55',
            zooms: [1, 30]
        });
        let terminal = this.MercatorWeblonLat(this.position);
        let positionFirst = null, positionSecond = null;
        AMap.plugin('AMap.Geolocation', function() {
            let geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,//是否使用高精度定位，默认:true
                timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                maximumAge: 0,           //定位结果缓存0毫秒，默认：0
                convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
                showButton: true,        //显示定位按钮，默认：true
                buttonPosition: 'LB',    //定位按钮停靠位置，默认：'LB'，左下角
                buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                showMarker: true,        //定位成功后在定位到的位置显示点标记，默认：true
                showCircle: true,        //定位成功后用圆圈表示定位精度范围，默认：true
                panToLocation: true,     //定位成功后将定位到的位置作为地图中心点，默认：true
                zoomToAccuracy:true,     //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false,
                useNative:true           //是否使用高德定位sdk用来辅助优化定位效果，默认：false.仅供在使用了高德定位sdk的APP中，嵌入webview页面时使用
            });
            map.addControl(geolocation);
            geolocation.getCurrentPosition(function(status, result){
                if (status=='complete'){
                    positionFirst = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(result.position.lng, result.position.lat)
                    });
                    positionSecond = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(terminal.lng, terminal.lat)
                    });
                    let p1 = positionFirst.getPosition(), p2 = positionSecond.getPosition();
                    let distance = Math.round(p1.distance(p2));

                    let geocoder = new AMap.Geocoder({ city: '全国' })
                    let lnglat = [result.position.lng, result.position.lat]
                    geocoder.getAddress(lnglat, function (status, result) {
                        if (status === 'complete' && result.info === 'OK') {
                            me.setState({ distance, currentPosition: result.regeocode.formattedAddress, isLoading: true });
                        }
                    })
                } else {
                    Toast.warn("定位失败");
                    alert(JSON.stringify(result))
                }
            });
        });
    }
    goToRule() {
        this.props.prop.history.push({
            pathname: '/attendanceRule',
            query: {
                period: this.state.ruledTimeIn.substring(0, 5) + '-' + this.state.ruledTimeOut.substring(0, 5),
                terminal: this.state.terminal,
                range: this.state.range
            }
        });
    }
    goToResult(result, time) {
        this.setState({ showResult: true, result, time });
    }
    backToMain() {
        this.getRecordData();
        this.setState({ showResult: false });
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
    render() {
        let { 
                image,
                name,
                group,
                day,
                timeStatus,
                terminal,
                distance,
                range,
                ruledTimeIn,
                ruledTimeOut,
                startTime,
                endTime,
                startAddress,
                endAddress,
                showCheckIn,
                showCheckOut,
                configData,
                currentPosition,
                result,
                time,
                showResult,
                isLoading
            } = this.state;
            let showIn = (startTime || showCheckIn) ? true : false;
            let showOut = (endTime || showCheckOut) ? true : false;
            let startStatus = startTime && configData ? this.getAttendanceStatus(moment(new Date(startTime)).format("HH:mm:ss"), configData) : '缺卡';
            let endStatus = endTime && configData ? this.getAttendanceStatus(moment(new Date(endTime)).format("HH:mm:ss"), configData) : '缺卡';
        return (
            isLoading &&
            <div className="attendance-container">
                <div className="basic-information">
                    <img src={ image } alt="avatar" />
                    <div className="name-container">
                        <h5>{ name }</h5>
                        <span>考勤组: { group }</span>
                        <span onClick={ () => this.goToRule() }>(查看规则)</span>
                    </div>
                </div>
                {
                    !showResult &&
                    <div className="center-container">
                        <div id="location" style={{ display: 'none'}}></div>
                        <div className="date-container">
                            <span>{ moment().format('YYYY年MM月DD日')}</span>
                            <span>{ '星期' + day }</span>
                            <span>{ ruledTimeIn.substring(0, ruledTimeIn.length - 3)+ '-' + ruledTimeOut.substring(0, ruledTimeOut.length - 3) }</span>
                        </div>
                        {
                            configData &&
                            <div className="record-container">
                                <div className="check-in record-box" style={{ display: showIn ? 'block' : 'none' }}>
                                    <div className="attendance-info">
                                        <img src={ icon_record_checkin }/>
                                        <span>上班打卡时间</span>
                                        <span>{ startTime ? moment(new Date(startTime)).format('HH:mm:ss') : '无' }</span>
                                        <span className={ startStatus === '正常上班' ? 'blue' : (startStatus === '迟到' ? 'yellow' : 'red') }>
                                            { startStatus === '正常上班' ? '正常' : (startStatus === '迟到' ? '迟到' : '缺卡') }
                                        </span>
                                    </div>
                                    { 
                                        startStatus !== '缺卡' && startAddress &&
                                        <div className="address-container">
                                            <img src={ icon_record_position }/>
                                            <span>{ startAddress }</span>
                                        </div>
                                    }
                                </div>
                                <div className="check-off record-box" style={{ display: showOut ? 'block' : 'none' }}>
                                    <div className="attendance-info">
                                        <img src={ icon_record_checkout }/>
                                        <span>下班打卡时间</span>
                                        <span>{ endTime ? moment(new Date(endTime)).format('HH:mm:ss') : '无' }</span>
                                        <span className={ endStatus === '正常下班' ? 'blue' : (endStatus === '早退' ? 'yellow' : 'red') }>
                                            { endStatus === '正常下班' ? '正常' : (endStatus === '早退' ? '早退' : '缺卡') }
                                        </span>
                                    </div>
                                    { 
                                        endStatus !== '缺卡' && endAddress &&
                                        <div className="address-container">
                                            <img src={ icon_record_position }/>
                                            <span>{ endAddress }</span>
                                        </div> 
                                    }
                                </div>
                            </div>
                        }
                        {   !showOut &&
                            <Main
                                name =  { name }
                                timeStatus={ timeStatus }
                                distance={ distance }
                                currentPosition={ currentPosition }
                                range={ range }
                                prop={ this.props.prop }
                                terminal={ terminal }
                                configData={ configData }
                                getDistance={ () => this.getDistance() }
                                goToResult={ (result, time) => this.goToResult(result, time) }/>
                        }
                    </div>
                }
                {   
                    showResult &&
                    <div className="result-container">
                        <span>{ result }</span><br/>
                        <span>打卡时间: { time }</span>
                        <img src={ result === '迟到打卡成功' || result === '早退打卡成功' ? icon_attendance_unusual : icon_attendance_normal }/>
                        <a onClick={ () => this.backToMain() }>返回</a>
                    </div>
                }
            </div>
        );
    }
}
export default clock;
