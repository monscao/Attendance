/*
 * @Date: 2021-05-19
 * @Description: 地图设置
 */
import React, { Component } from 'react';
import API from '../../../../../api/api';
import { Button } from 'antd-mobile';
import { Toast } from '@/pages/project/yjpt/components/PandaToast.jsx';
import './map.less';

import icon_map_location from '@/asset/image/xian/attendance/icon_map_location.png';
import icon_setting_search from '@/asset/image/xian/attendance/icon_setting_search.png';
import icon_position_selected from '@/asset/image/xian/attendance/icon_position_selected.png';

class map extends Component {
    state = {
        resultList: [],
        selectedId: '',
        id: null,
        name: '',
        location: ''
    }
    componentWillMount() {
        sessionStorage.setItem('attendanceInfos', JSON.stringify({ father: 'setting' }));
    }
    componentDidMount() {
        let me = this;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const input = document.querySelector('#searchContainer');
        input.addEventListener('click', () => {
            setInterval(() => {
                input.scrollIntoView(false);
            }, 100);
        })
        let settingInfos = JSON.parse(sessionStorage.getItem('settingInfos'));
        this.state.id = settingInfos.id;
        this.state.name = settingInfos.address;
        this.state.location = settingInfos.location;
        let geoLocation = settingInfos.geoLocation;
        let map = new AMap.Map("positionSetting", {
            mapStyle: 'amap://styles/21dd5fbddf5887f5b5e74366b005f3a7',
            zoom: 15,
            center: [geoLocation.lng, geoLocation.lat]
        });
        AMap.plugin(['AMap.PlaceSearch', 'AMap.Autocomplete'], function() {
            let autoOptions = {
                input: "searchInput"
            };
            let auto = new AMap.Autocomplete(autoOptions);
            let placeSearch = new AMap.PlaceSearch({
                map: map,
                city: "029",
                pageSize: 9999,
                citylimit: true,
                autoFitView: true
            });
            AMap.Event.addListener(auto, "select", select);
            function select(e) {
                placeSearch.setCity(e.poi.adcode);
                placeSearch.search(e.poi.name, (status, result) => {
                    if (status=='complete'){
                        me.setState({ resultList: result.poiList.pois });
                    } else {
                        Toast.warn("搜索失败");
                    }
                });
            }
        });
        let terminal = new AMap.Marker({
            position: new AMap.LngLat(geoLocation.lng, geoLocation.lat),
            icon: icon_map_location,
            offset: new AMap.Pixel(-19, -19)
        });
        map.add(terminal);
    }
    selectPosition(id, location, name) {
        this.setState({ selectedId: id });
        this.state.location = location[0].toString() + ',' + location[1].toString();
        this.state.name = name;
    }
    getList(selectedId) {
        return (
            this.state.resultList.map((item, index) => {
                return (
                    <div key={ index } className="list-item" onClick={ () => this.selectPosition(item.id, item.location.pos, item.name) }>
                        <img src={ item.photos.length ? item.photos[0].url : 'http://a.amap.com/jsapi_demos/static/images/search-img-default.png' }/>
                        <div className="item-infos">
                            <span>{ item.name }</span>
                            <span style={{ display: item.address ? 'block' : 'none' }}>地址:{ item.address }</span>
                            <span style={{ display: item.tel ? 'block' : 'none' }}>电话:{ item.tel }</span>
                        </div>
                        <div className="selected-icon" style={{ display: item.id === selectedId ? 'block' : 'none'}}>
                            <img src={ icon_position_selected }/>
                        </div>
                    </div>
                )
            })
        )
    }
    save = async() => {
        let params = {
            data: {
                "IDArrs": [this.state.id],
                "ColumnValueList": [[this.state.location, this.state.name]]
            },
            params: {
                tableName: "数据_台账_考勤配置表",
                isTableCheck: false,
                columnNameString: "打卡位置,公司地址"
            }
        };
        Toast.loading();
        let res = await API.UpdateDataByTableName(params);
        Toast.hide();
        if (res.statusCode === '0000') {
            window.history.back();
        } else {
            Toast.warn('新增打卡记录失败');
        }
    }
    render() {
        let { resultList, selectedId } = this.state;
        return (
            <div id="positionSetting" className="position-setting">
                <div id="searchContainer" className="search-container">
                    <div className="input-container">
                        <img src={ icon_setting_search }/>
                        <input id="searchInput" type="text" placeholder="搜索地点或地址" />
                    </div>
                    <div className="result-container" style={{ display: resultList.length ? 'block' : 'none'}}>
                        <div className="result-list">
                            { resultList.length && this.getList(selectedId) }
                        </div>
                    </div>
                    <div className="save-container" style={{ display: resultList.length ? 'block' : 'none', marginTop: resultList.length ? '' : '0.43rem'}}>
                        <Button type="primary" onClick={ ()=> this.save() }>保存</Button>
                    </div>
                </div>
            </div>
        )
    }
}

export default map;