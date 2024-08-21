export interface IPostTypeItem {
  name: string;
  count: number;
  percent: string;
}

export interface IPostTypes {
  total: number;
  image: IPostTypeItem;
  carouselAlbum: IPostTypeItem;
  reel: IPostTypeItem;
  video: IPostTypeItem;
  stories: IPostTypeItem;
}
