$(document).ready(function () {
    var ENTER_KEY = 13;
    var ESC_KEY = 27;

    // 加载右侧区域的内容
    function load_content_page(url) {
        $.ajax({
            type: 'GET',
            url: url,
            success: function (data) {
                $('#main').hide().html(data).fadeIn(800);
            },
            error:function (jqXHR, textStatus, errorThrown) {
                $('#main').hide().html(jqXHR.responseText).fadeIn(800);
            },
        });
    }

    $(document).on('click', '.load-content-btn', function(){
        var url = $(this).attr("data-href");
        load_content_page(url);
    });


    // 查询个股
    function searchStock(e) {
        var $input = $("#i_stockInput");
        var value = $input.val().trim()
        if (e.which !== ENTER_KEY || !value) {
            return;
        }
        $input.focus().val('');

        var url = stock_page_url + "?code=" + value;
        load_content_page(url);
    }

    $(document).on('keyup', '#i_stockInput', searchStock.bind(this));

    // 创建分组
    function create_group() {
        var name = $("#i_createGroupInput").val();
        $.ajax({
            type: 'POST',
            url: create_group_url,
            data: JSON.stringify({'name': name}),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                alert(data["message"]);
                $(window).trigger('hashchange');
            }
        });
    }

    // 移除分组
    function remove_group() {
        var group_id = $("#i_removeGroupInfo").attr("data-group");
        $.ajax({
            type: 'DELETE',
            url: remove_group_url,
            data: JSON.stringify({'group_id': group_id}),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                alert(data["message"]);
                // $(window).trigger('hashchange');
            }
        });
    }

    $(document).on('click', '#i_createGroupButton', create_group);
    $(document).on('click', '#i_removeGroupButton', remove_group);

    // 往某分组里添加股票
    function add_group_stock() {
        var $input = $("#i_addGroupStockInput");
        var code = $input.val();
        var add_url = $input.attr("data-href");
        var cur_group_detail_url = $("#i_groupDetailUrl").attr("data-href");
                
        $.ajax({
            type: 'POST',
            url: add_url,
            data: JSON.stringify({'code': code}),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                alert(data["message"]);
                load_content_page(cur_group_detail_url);
            }
        });
    }

    // 往某分组里移除股票
    function rm_group_stock() {
        var $input = $("#i_rmGroupStockInfo")
        var code = $input.attr("data-code");
        var rm_url = $input.attr("data-href");
        var cur_group_detail_url = $("#i_groupDetailUrl").attr("data-href");
        
        $.ajax({
            type: 'DELETE',
            url: rm_url,
            data: JSON.stringify({'code': code}),
            contentType: 'application/json;charset=UTF-8',
            success: function (data) {
                alert(data["message"]);
                load_content_page(cur_group_detail_url);
            }
        });
    }

    $(document).on('click', '#i_addGroupStockButton', add_group_stock);
    $(document).on('click', '#i_rmGroupStockButton', rm_group_stock);

    // 检查校正input输入框中的数值类型
    function check_number() {
        this.value = this.value.replace(/\D/g,'');
    }

    $(document).on('keyup', '.input-number', check_number);
});


// ===============画图函数==================

/**
 * 公司收入曲线，双坐标轴，左边：金额   右边:同比
 * @param {*} domId : htm中的id,曲线图将被绑定到该id下
 * @param {*} data ： 绘图相关数据
 */
function plotIncomeMixLineBar(domId, data){
    // 解析参数
    var xLabels = data.xLabels;  // x轴标签序列
    var valueName = data.name;
    var values = data.values;
    // 计算同比
    var rateName = "同比";
    var rates = data.rates;
    if (typeof(rates) == "undefined") {
        var size = values.length;
        var rates = new Array(size);
        rates[0] = null;
        for (var i=1; i < size; i++) {
            rates[i] = 100 * (values[i] - values[i-1]) / values[i-1];
        }
    }

    var legendData = [valueName, rateName];

    // 构造echarts的option
    var myChart = echarts.init(document.getElementById(domId));
    var option = {
        tooltip: {
            trigger: 'axis',
        },
        legend: {
            data: legendData
        },
        xAxis: [
            {
                type: 'category',
                data: xLabels,
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: '金额(元)',
                axisLabel: {
                    formatter: '{value}'
                }
            },
            {
                type: 'value',
                name: '百分比',
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    formatter: '{value}%'
                }
            }
        ],
        series: [
            {
                name: valueName,
                type: 'bar',
                data: values
            },
            {
                name: rateName,
                type: 'line',
                yAxisIndex: 1,
                data: rates
            }
        ]
    };
    myChart.setOption(option);
}

/**
 * 绘制曲线图
 * @param {*} domId : htm中的id,曲线图将被绑定到该id下
 * @param {*} data 
 */
function plotLines(domId, data) {
    var xLabels = data.xLabels;
    var items = data.items;

    var size = items.length;
    var legendData = new Array(size);
    var seriesData = new Array(size);

    items.forEach(function(item){
        legendData.push(item.name);
        seriesData.push({
            name: item.name,
            data: item.values,
            type: 'line',
            smooth: true
        });
    })

    // 构造echarts的option
    var myChart = echarts.init(document.getElementById(domId));
    var option = {
        legend: {
            data: legendData,
        },
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: xLabels
        },
        yAxis: {
            type: 'value'
        },
        series: seriesData,
    };
    myChart.setOption(option);
}


// 验证
function validate_required(value,alerttxt="输入为空"){
    if (value==null||value==""){
        alert(alerttxt);
        return false;
    }
    else {
        return true;
    }
}
