
/**
 * Created by Dio on 2017/5/18.
 */
var React = require('react');
var _ = require('lodash');
var AuthToken = require('yylib-utils/AuthToken');

/*****公共的静态类方法******/
var CardHandlerApi = {};
//页面遮罩
CardHandlerApi.pageLoading = function(page){
    CardEventHandler.pageLoading(page);
};
CardHandlerApi.pageLoaded = function (page) {
    CardEventHandler.pageLoaded(page)
}
//setFormData
CardHandlerApi.setData = function (page, data) {
    CardEventHandler.setData(page,data);
}
//初始化配置
CardHandlerApi.init = function(page,urls,options){
    // 给页面上的orgId加上筛选条件
    var orgId = page.findUI('orgId')
    orgId.condition = {companyId:AuthToken.getOrgaId(), orgFunName:'discipline'}
    // orgId在编辑页面 不允许修改
    var query = page.getRouteQuery();
    if(query && query.id){
        // 示范点创建时不需要
        if(query && query.type == 'create'){
            orgId.disabled = false
        }else{
            orgId.disabled = true
        }

    }
    CardEventHandler.init(page,urls,options);
};
CardHandlerApi.initPersonRefer = function(page, editTableName, needCompanyPostId){
    CardHandlerApi._page = page;
    CardHandlerApi._editTableName = editTableName;
    CardHandlerApi._needCompanyPostId = !!needCompanyPostId;
};

CardHandlerApi.initTableValidateParam = function(page, tableValidateParam) {
    CardHandlerApi._tableValidateParam = tableValidateParam
}
//开始时间，结束时间
CardHandlerApi.setStartTime = function(page,obj){
    var endTime = page.findUI('endTime')
    if(endTime){
        endTime.disabledDate = (value) => {  //结束日期禁用小于开始日期的日期
            if (!value) {
                return false;
            }
            return value.getTime() <= new Date(obj).getTime();
        };
        page.refresh();
    }
};

CardHandlerApi.setEndTime = function(page,obj){
    var startTime = page.findUI('startTime')
    if(startTime){
        startTime.disabledDate = (value) => {  //开始日期禁用大于结束日期的日期
            if (!value) {
                return false;
            }
            if (obj) {
                return value.getTime() > new Date(obj).getTime();
            }
        };
        page.refresh();
    }
};
CardHandlerApi.saveEditTable = function (page) {
    var tables = CardEventHandler.getEditTables(page)
    _.forEach(tables, function (table) {
        //有可能隐藏表格（在隐藏的页签中）还没加载出api对象
        if(table && table.api){
            table.dataSource = table.api.getDataSource()
        }
    })
}
// 子表重复验证，指定table的uikey和列名的uikey
CardHandlerApi.valReplyEditTable = function (page, param) {
    var msg = []
    // 循环表单
    _.forEach(_.keys(param), function(tableKey){
        var dupSets = [] // 存放重复的记录
        var table = page.findUI(tableKey);
        if(table && table.api){
            var dataSource = table.api.getDataSource();

            var dataSets = [] // 存放制定列的值
            // 循环表单的指定列
            _.forEach(param[tableKey], function(colKey){
                // 验证的字段值放入dataSets中
                _.forEach(dataSource, function(rowData){
                    dataSets.push(JSON.stringify(rowData[colKey]))
                })
            })
            // 将重复的记录放入dupSets
            dupSets = _.filter(dataSets, function (value, index, iteratee) {
                return _.includes(iteratee, value, index + 1);
            });
            //如果有重复的，放入dupMsgSets中 ,isValidate = false
        }
    })

    if(msg && msg.length){
        YYMessage.error(msg.join(',') + '存在重复记录', 4)
        return true
    } else {
        return false
    }
}
/*****公共的事件绑定******/
var CardHandler = _.assign({},CardEventHandler.API,{
    "addPersonBtn":{
        onClick:function(){
            var personRefer = this.findUI('personRefer')
            personRefer.visible = true;
            this.refresh()
        }
    },
    "personRefer":{
        onOk:function(newRows){
            this.findUI('personRefer').visible = false;
            this.refresh(()=>{
                var tableName = CardHandlerApi._editTableName;
                var editTable = this.findUI(tableName)
                // 需要删除的行
                var newRowsDel = []
                // 需要保存的行
                var newRowsSave = newRows
                //获取纪检组织登记子表
                // 过滤掉 dataSource 中已经存在的元素
                var dataSource = [];
                if (tableName == 'supervisors' || tableName == 'committeeMembers'){
                    var supervisors = this.findUI('supervisors').api.getDataSource();
                    var committeeMembers = this.findUI('committeeMembers').api.getDataSource();
                    dataSource=supervisors.concat(committeeMembers);
                }else {
                    dataSource = editTable.api.getDataSource()
                }
                if(dataSource && dataSource.length){
                    newRowsSave = _.filter(newRows, function (row) {
                        var duplicate = true
                        for(var index = 0; index < dataSource.length; index++) {
                            if(dataSource[index].personnelId && row.personnelId && dataSource[index].personnelId.id == row.personnelId.id){
                                duplicate = false
                                newRowsDel.push(row)
                                break
                            }
                            if(dataSource[index].name && row.name && dataSource[index].name == row.name){
                                duplicate = false
                                newRowsDel.push(row)
                                break
                            }
                        }
                        return duplicate
                    })
                }
                if(!CardHandlerApi._needCompanyPostId){
                    _.map(newRowsSave, function (row) {
                        delete row.companyPostId
                    })
                }
                // 提示信息
                if(newRowsDel && newRowsDel.length){
                    var names = newRowsDel.map(function(item) {
                        return item.personnelId.name + ' ';
                    });
                    YYMessage.info(`已自动去掉重复的人员：${names}`, 4)
                }
                if(newRowsSave && newRowsSave.length){
                    editTable.api.addRow(newRowsSave,function () {
                        editTable.dataSource = editTable.api.getDataSource()
                    })
                }
            })
        },
        onCancel:function(){
            this.findUI('personRefer').visible = false;
            this.refresh()
        }
    },
    "startTime": {
        "onChange": function (obj) {
            CardHandlerApi.setStartTime(this,obj)
        }
    },
    "endTime": {
        "onChange": function (obj) {
            CardHandlerApi.setEndTime(this,obj)
        }
    },
    // 添加
    "plusBtn": {
        onClick: function onClick() {
            if (this.findUI('orgId')){
                this.findUI('orgId').disabled=false;
            }
            CardEventHandler.resetPage(this);
        }
    },
    "saveBtn": {
        onClick: function onClick(btnKey) {
            CardHandlerApi.saveEditTable(this)
            if(CardHandlerApi.valReplyEditTable(this, CardHandlerApi._tableValidateParam)){
                // errors
            } else {
                // 加loading状态判断是为了解决连续点击保存按钮导致数据重复保存的bug
                var cardPageKey = CardEventHandler.getCardPageKey(this);
                var isLoading = this.findUI('' + cardPageKey).loading;
                if (!isLoading) {
                    if (this.findUI('orgId')&& btnKey === 'saveAddBtn'){
                        this.findUI('orgId').disabled=false;
                    }
                    CardEventHandler.saveData(this, { "btnKey": btnKey });
                }
            }
        }
    },

});

module.exports = {CardHandler,CardHandlerApi};
