from flask import render_template, current_app, Blueprint, jsonify, flash, request, abort

from stocknote.extensions import db
from stocknote.models.individual import Pool
from stocknote.models.stock import Stock
from stocknote.services.quotation import get_latest_price


individual_bp = Blueprint("individual", __name__)


@individual_bp.route("/stock-pool")
def stock_pool():
    from random import choice
    q = db.session.query(Pool.code, Pool.update_time, Pool.positive_valuation,
                         Pool.negative_valuation, Pool.safe_of_margin, Stock.name) \
        .outerjoin(Stock, Pool.code==Stock.code).all()
    prices = get_latest_price([item.code for item in q])
    items = []
    for item in q:
        latest_price = prices.get(item.code)
        if isinstance(latest_price,float):
            if latest_price < item.negative_valuation * (1 - item.safe_of_margin):
                status = 1
            elif latest_price > item.negative_valuation:
                status = -1
            else:
                status = 0
            latest_price_ = latest_price
        else:
            status = 0
            latest_price_ = "-"
    
        new_item = {
            "code": item.code,
            "name": item.name,
            "valuate_date": item.update_time.strftime("%Y-%m-%d"),
            "positive_valuation": item.positive_valuation,
            "positive_safe_of_margin": item.positive_valuation * (1 - item.safe_of_margin),
            "negative_valuation": item.negative_valuation,
            "negative_safe_of_margin": item.negative_valuation * (1 - item.safe_of_margin),
            "status": status,
            "latest_price": latest_price_,
        }
        items.append(new_item)
    return render_template("individual/parts/_stock_pool.html", items=items)


@individual_bp.route("/stock-pool/op/add-stock", methods=["POST"])
def api_op_add_stock_to_pool():
    data = request.get_json()
    if "code" not in data:
        return jsonify(message="未接收到请求参数.")
    
    code = data["code"]
    positive_valuation = data.get("positive_valuation", 0)
    negative_valuation = data.get("negative_valuation", 0)
    safe_of_margin = data.get("safe_of_margin", 0.25)
    
    pool_item = Pool(code=code,
                    positive_valuation=positive_valuation,
                    negative_valuation=negative_valuation,
                    safe_of_margin=safe_of_margin
                    )
    db.session.add(pool_item)
    db.session.commit()
    return jsonify(status=200, message="添加成功")


@individual_bp.route("/stock-pool/op/rm-stock", methods=["DELETE"])
def api_op_rm_stock_from_pool():
    data = request.get_json()
    if "code" not in data:
        return jsonify(message="未接收到请求参数.")
    code = data["code"]
    Pool.query.filter_by(code=code).delete(synchronize_session=False)
    db.session.commit()
    return jsonify(status=200, message="移除成功")


@individual_bp.route("/stock-pool/op/update-stock", methods=["PATCH"])
def api_op_update_stock_in_pool():
    data = request.get_json()
    if "code" not in data:
        return jsonify(message="未接收到请求参数.")
    code = data["code"]
    info = {}
    if "positive_valuation" in data:
        info["positive_valuation"] = data["positive_valuation"]
    if "negative_valuation" in data:
        info["negative_valuation"] = data["negative_valuation"]
    if "safe_of_margin" in data:
        info["safe_of_margin"] = data["safe_of_margin"]
    print(info)
    item = Pool.query.filter_by(code=code).update(info)
    db.session.commit()
    return jsonify(status=200, message="更新成功")


@individual_bp.route("/stock-pool/data/pool-item", methods=["GET"])
def api_data_get_pool_item():
    code = request.args.get("code", type=str)
    item = Pool.query.filter_by(code=code).first_or_404()
    data = {
        "code": item.code,
        "positive_valuation": item.positive_valuation,
        "negative_valuation": item.negative_valuation,
        "safe_of_margin": item.safe_of_margin
    }
    return jsonify(status=200, message="", data=data)
        
