var React = require('react');
var _ = require('lodash');
var {YYClass,YYMessage } = require('yylib-ui');
var {YYCreatePage} =  require('yylib-business');
var ajax = require('yylib-utils/ajax');
var AuthToken = require("yylib-utils/AuthToken");
var urls = require('../../../actions/RestUrl').person;
var {CardHandlerApi, CardHandler, ListHandler} = require('../../../actions/ProjectHandler');

function addTableRow(){
    //好像被修改了
    console.log(1);
    console.log(2);
    console.log(2);
    console.log(2);
    console.log(2);
    var table = this
    table.api.addRow({
        isEdit:true
    })
}

function hideDetails(visible){
    console.log(1);console.log(1);console.log(1);
    console.log(1);console.log(1);console.log(1);
    this.setState({isLeader:visible})
    this.findUI('rewardCard').isShow = visible
    this.findUI('workhistoryCard').isShow = visible
    this.findUI('punishCard').isShow = visible
    this.findUI('trainCard').isShow = visible
}
// 删除子表行
function delTableRow(){
    var table = this
    var keys = table.api.getSelectedRowKeys()
    if(keys && keys.length){
        table.api.delRow(keys)
    }else{
        YYMessage.warn('请选择')
    }
}

var EventHandler = {
    saveBtn:{
        onClick:function(){
            CardHandlerApi.saveEditTable(this)
            var baseform = this.findUI('baseform')
            var workHistories = this.findUI('workHistories');
            var rewardHistories = this.findUI('rewardHistories');
            var punishHistories = this.findUI('punishHistories');
            var trainHistories = this.findUI('trainHistories');
            var auditInfo=this.findUI('auditInfo');
            var url = urls.save
            var _this = this
            var partTimeTypeCode =baseform.api.getFieldsValue().partTimeTypeCode;
            var jobTypeCode =baseform.api.getFieldsValue().jobTypeCode;
            console.log(jobTypeCode)
            if (jobTypeCode.name !="专职"){
                if (partTimeTypeCode == null){
                    YYMessage.error('请选择兼职类型');
                    return;
                }
            }
            var dataSource = workHistories.api.getDataSource();
            // console.log('dataSource', dataSource)
            for (var i = 0; i < dataSource.length; i++) {
                if (!dataSource[i].communicateSituation) {
                    YYMessage.error('交流情况为必输项');
                    workHistories.api.editRowData(dataSource[i].id);
                    return;
                }
            }
            baseform.api.validateFieldsAndScroll(function(errors,values){
                if(!!errors){
                }else{
                    // 提交表单
                    if(_this.state.isLeader){
                        values.workHistories = workHistories.api.getDataSource()
                        values.rewardHistories = rewardHistories.api.getDataSource()
                        values.punishHistories = punishHistories.api.getDataSource()
                        values.trainHistories = trainHistories.api.getDataSource()
                        values.auditInfo=auditInfo.api.getFieldsValue()
                    }
                    values.userId = AuthToken.getUserId();
                    ajax.postJSON(urls.update,values,function(result){
                        if(result.success){
                            YYMessage.success(result.backMsg)
                            CardHandlerApi.setData(_this, result.backData)
                        }else{
                            YYMessage.error(result.backMsg)
                        }
                    })
                }
            })
        }
    },
    // 加载页面
    page:{
        onViewWillMount:function(){
            // var query = this.getRouteQuery()
            hideDetails.call(this,true)
        },
        onViewDidMount:function(){
            // 设置默认参数
            var baseform = this.findUI('baseform')
            var workHistories = this.findUI('workHistories');
            var rewardHistories = this.findUI('rewardHistories');
            var punishHistories = this.findUI('punishHistories');
            var trainHistories = this.findUI('trainHistories');

            this.findUI('page').loading = true
            this.refresh()
            var _this = this
            ajax.getJSON(urls.detail, {userId:AuthToken.getUserId()}, function(result){
                if(result.success){
                    var backData = result.backData
                    backData.sex = backData.sex.toString()
                    CardHandlerApi.setData(_this, backData)

                    if (backData.jobTypeCode && backData.jobTypeCode.name=='专职') {
                        _this.findUI("partTimeTypeCode").disabled = true;
                        _this.findUI("partTimeTypeCode").required = false;
                        _this.refresh();
                    }else{
                        _this.findUI("partTimeTypeCode").disabled = false;
                        _this.findUI("partTimeTypeCode").required = true;
                    }
                    _.forEach(workHistories.children,function(child){
                        // console.log('child', child)
                        child.isEditable = function(options){
                            if(child.uikey=='disciplineInspectionDuty' || child.uikey=='communicateSituation'
                                || child.uikey=='communicateType'){
                                return true
                            }else{
                                return !options.rowData.portal
                            }
                        }
                    })

                    var portalCol = _.find(workHistories.children, {dataIndex:'portal'})
                    portalCol.render = function (value, record, index) {
                        return value ? '人员调动' : '手动输入'
                    }
                }else{
                    YYMessage.error(result.backMsg)
                }
                _this.findUI('page').loading = false
                _this.refresh()

            })
        }
    },
    //人员分类
    jobTypeCode:{
        onChange:function (e) {
            // console.log('e',e)
            if (e.name == "专职") {
                this.findUI("partTimeTypeCode").disabled = true;
                this.findUI("partTimeTypeCode").required = false;
                this.findUI("baseform").api.setFieldsValue({partTimeTypeCode:''});
                this.refresh();
            } else {
                this.findUI("partTimeTypeCode").disabled = false;
                this.findUI("partTimeTypeCode").required = true;
                this.refresh();
            }
        }
    },
    //兼职类型
    partTimeTypeCode:{
        onChange:function (e) {
            var jobTypeCode = this.findUI('jobTypeCode');
            if (jobTypeCode == null){
                var _this = this;
                setTimeout(function () {
                    _this.findUI("baseform").api.setFieldsValue({partTimeTypeCode:{defdocId:''}});
                },100)
                YYMessage.error('请先选择人员分类');
                this.refresh();
            }
        }
    },
    accordion:{
        onViewDidMount:function(options){
            console.log('options',options)
        }
    },
    // 选择职务时动态显示子表
    // disciplineInspectionDutyCode:{
    //     onChange:function(value){
    //         if(value.id=='8a83898b5c0ac248015c0b210636001b'){
    //             hideDetails.call(this, true)
    //         }else{
    //             hideDetails.call(this, false)
    //         }
    //         this.refresh()
    //     }
    // },
    // 工作履历
    addWorkHistory:{
        onClick:function(){
            addTableRow.call(this.findUI('workHistories'))
        }
    },
    delWorkHistory:{
        onClick:function(){
            delTableRow.call(this.findUI('workHistories'))
        }
    },
    // 所受奖励
    addRewardHistories:{
        onClick:function(){
            addTableRow.call(this.findUI('rewardHistories'))
        }
    },
    delRewardHistories:{
        onClick:function(){
            delTableRow.call(this.findUI('rewardHistories'))
        }
    },
    // 所受惩处
    addPunishHistories:{
        onClick:function(){
            addTableRow.call(this.findUI('punishHistories'))
        }
    },
    delPunishHistories:{
        onClick:function(){
            delTableRow.call(this.findUI('punishHistories'))
        }
    },
    // 培训情况
    addTrainHistories:{
        onClick:function(){
            addTableRow.call(this.findUI('trainHistories'))
        }
    },
    delTrainHistories:{
        onClick:function(){
            delTableRow.call(this.findUI('trainHistories'))
        }
    },
    exportBtn: {
        onClick: () => {
            fetch(urls.exportDetail + '?userId='+AuthToken.getUserId(),{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authority': AuthToken.getAuthenticationStr(),
                    'icop-token': AuthToken.getToken()
                }
            }).then((response) => response.blob()).then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.setAttribute('style', 'display:none');
                a.setAttribute('href', objectUrl);
                a.setAttribute('download', "个人基本信息表");
                a.click();
                URL.revokeObjectURL(objectUrl);
            })
        }
    },
    workHistories:{
        "onCellChange": function (options) {
            var {rowData, rowIndex, dataIndex, newVal}=options;
            if(dataIndex == 'beginDate'){
                this.findUI('endDate').disabledDate = function (options,value) {
                    console.log(options);
                    if (!newVal) {
                        return false;
                    }
                    if (options.rowData.beginDate) {
                        return value.getTime() <= new Date(options.rowData.beginDate).getTime();
                    }
                }
            } else if (dataIndex == 'endDate') {
                this.findUI('beginDate').disabledDate = function (options,value) {
                    if (!newVal) {
                        return false;
                    }
                    if (options.rowData.endDate) {
                        return value.getTime() > new Date(options.rowData.endDate).getTime();
                    }
                }
            }
            this.findUI('workHistories').dataSource = this.findUI('workHistories').api.getDataSource()
            this.refresh()
        }
    }
}

var PersonForm = YYClass.create({
    render:function(){
        return <YYCreatePage {...this.props} appCode="A000246" pageCode="P001096" uiEvent={_.assign({},ListHandler,EventHandler)}></YYCreatePage>
    }
})

module.exports = PersonForm;
