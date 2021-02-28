import UserNameAndDefaultPostQueryOperations
  from "../../../../backk/types/useraccount/UserNameAndDefaultPostQueryOperations";
import DefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import SortBy from "../../../../backk/types/postqueryoperations/SortBy";

export default class GetUserAccountArg extends UserNameAndDefaultPostQueryOperations {
  excludeResponseFields = [
    'ownSalesItems.primaryDataImageUri',
    'followedUsers.ownSalesItems',
    'followingUsers.ownSalesItems'
  ];

  sortBys = [
    ...new DefaultPostQueryOperations().sortBys,
    new SortBy('paymentMethods', 'isDefault', 'DESC'),
    new SortBy('ownSalesItems', 'state', 'ASC')
  ]
}
